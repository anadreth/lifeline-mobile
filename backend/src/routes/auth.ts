import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Joi from 'joi';
import { getPrisma } from '../config/prisma';
import { EncryptionService } from '../utils/encryption';
import { ValidationError, ConflictError, UnauthorizedError } from '../middleware/errorHandler';
import { cacheSet } from '../config/redis';
import { logger } from '../utils/logger';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])')).required(),
  deviceId: Joi.string().optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  deviceId: Joi.string().optional()
});

// Register new user
router.post('/register', async (req, res, next) => {
  try {
    // Validate input
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      throw new ValidationError('Invalid input', error.details);
    }

    const { email, password, deviceId } = value;
    const prisma = getPrisma();

    // Hash email for privacy
    const emailHash = EncryptionService.hash(email.toLowerCase());

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email_hash: emailHash },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictError('User already exists');
    }

    // Generate salt and hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Generate RSA key pair for the user
    const { publicKey, privateKey } = EncryptionService.generateRSAKeyPair();

    // Derive master key from password for encrypting private key
    const masterKey = EncryptionService.deriveKey(password, salt);
    const encryptedPrivateKey = EncryptionService.encrypt(privateKey, masterKey);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email_hash: emailHash,
        salt: salt,
        password_hash: passwordHash,
        public_key: publicKey,
        encrypted_private_key: JSON.stringify(encryptedPrivateKey),
      },
      select: {
        id: true,
        created_at: true,
      },
    });

    const userId = newUser.id;

    // Generate initial data encryption keys
    const examKey = EncryptionService.generateKey();
    const vitalsKey = EncryptionService.generateKey();
    const recordsKey = EncryptionService.generateKey();

    // Encrypt data keys with user's public key
    const encryptedExamKey = EncryptionService.encryptWithRSA(examKey, publicKey);
    const encryptedVitalsKey = EncryptionService.encryptWithRSA(vitalsKey, publicKey);
    const encryptedRecordsKey = EncryptionService.encryptWithRSA(recordsKey, publicKey);

    // Store encrypted data keys (convert to Buffer for Prisma Bytes type)
    await Promise.all([
      prisma.encryptedDataKey.create({
        data: {
          user_id: userId,
          data_type: 'exam',
          encrypted_key: Buffer.from(encryptedExamKey),
        },
      }),
      prisma.encryptedDataKey.create({
        data: {
          user_id: userId,
          data_type: 'vitals',
          encrypted_key: Buffer.from(encryptedVitalsKey),
        },
      }),
      prisma.encryptedDataKey.create({
        data: {
          user_id: userId,
          data_type: 'records',
          encrypted_key: Buffer.from(encryptedRecordsKey),
        },
      }),
    ]);

    // Generate JWT token
    const token = jwt.sign({ id: userId, emailHash }, process.env.JWT_SECRET!, { expiresIn: '24h' });

    // Log registration
    await prisma.auditLog.create({
      data: {
        user_id: userId,
        action: 'REGISTER',
        resource_type: 'user',
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        timestamp: new Date(),
      },
    });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: userId,
        publicKey,
        createdAt: newUser.created_at,
      },
      // Client needs these for initial setup
      encryptedPrivateKey,
      dataKeys: {
        exam: encryptedExamKey, // Already a string from EncryptionService
        vitals: encryptedVitalsKey,
        records: encryptedRecordsKey,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Login user
router.post('/login', async (req, res, next) => {
  try {
    // Validate input
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      throw new ValidationError('Invalid input', error.details);
    }

    const { email, password, deviceId } = value;
    const prisma = getPrisma();

    // Hash email
    const emailHash = EncryptionService.hash(email.toLowerCase());

    // Find user
    const user = await prisma.user.findUnique({
      where: { email_hash: emailHash },
      select: {
        id: true,
        salt: true,
        password_hash: true,
        public_key: true,
        encrypted_private_key: true,
        account_status: true,
        last_login: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    if (user.account_status !== 'active') {
      throw new UnauthorizedError('Account is suspended');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Get user's data keys
    const dataKeysRecords = await prisma.encryptedDataKey.findMany({
      where: { user_id: user.id },
      select: {
        data_type: true,
        encrypted_key: true,
      },
    });

    const dataKeys: Record<string, string> = {};
    dataKeysRecords.forEach((row) => {
      dataKeys[row.data_type] = Buffer.from(row.encrypted_key).toString('base64');
    });

    // Generate JWT token
    const token = jwt.sign({ id: user.id, emailHash }, process.env.JWT_SECRET!, { expiresIn: '24h' });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { last_login: new Date() },
    });

    // Log login
    await prisma.auditLog.create({
      data: {
        user_id: user.id,
        action: 'LOGIN',
        resource_type: 'user',
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        timestamp: new Date(),
      },
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        publicKey: user.public_key,
        lastLogin: user.last_login,
      },
      encryptedPrivateKey: JSON.parse(user.encrypted_private_key),
      dataKeys,
    });
  } catch (error) {
    next(error);
  }
});

// Logout user
router.post('/logout', authenticateToken, async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    const user = (req as AuthenticatedRequest).user;
    const prisma = getPrisma();

    if (token) {
      // Add token to blacklist (expires in 24h to match JWT expiry)
      await cacheSet(`blacklist:${token}`, 'true', 24 * 60 * 60);
    }

    // Log logout for audit trail
    await prisma.auditLog.create({
      data: {
        user_id: user.id,
        action: 'LOGOUT',
        resource_type: 'user',
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        timestamp: new Date(),
      },
    });

    res.json({ message: 'Logout successful' });
  } catch (error) {
    next(error);
  }
});

// Refresh token
router.post('/refresh', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      throw new UnauthorizedError('Token required');
    }

    // Verify current token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // Generate new token
    const newToken = jwt.sign(
      { id: decoded.id, emailHash: decoded.emailHash },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    // Blacklist old token
    await cacheSet(`blacklist:${token}`, 'true', 24 * 60 * 60);

    res.json({
      message: 'Token refreshed',
      token: newToken
    });

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Invalid token'));
    } else {
      next(error);
    }
  }
});

export default router;