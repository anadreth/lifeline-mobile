import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Joi from 'joi';
import { query } from '../config/database';
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

    // Hash email for privacy
    const emailHash = EncryptionService.hash(email.toLowerCase());

    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email_hash = $1',
      [emailHash]
    );

    if (existingUser.rows.length > 0) {
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
    const result = await query(
      `INSERT INTO users (email_hash, salt, password_hash, public_key, encrypted_private_key)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, created_at`,
      [emailHash, salt, passwordHash, publicKey, JSON.stringify(encryptedPrivateKey)]
    );

    const userId = result.rows[0].id;

    // Generate initial data encryption keys
    const examKey = EncryptionService.generateKey();
    const vitalsKey = EncryptionService.generateKey();
    const recordsKey = EncryptionService.generateKey();

    // Encrypt data keys with user's public key
    const encryptedExamKey = EncryptionService.encryptWithRSA(examKey, publicKey);
    const encryptedVitalsKey = EncryptionService.encryptWithRSA(vitalsKey, publicKey);
    const encryptedRecordsKey = EncryptionService.encryptWithRSA(recordsKey, publicKey);

    // Store encrypted data keys
    await Promise.all([
      query(
        'INSERT INTO encrypted_data_keys (user_id, data_type, encrypted_key) VALUES ($1, $2, $3)',
        [userId, 'exam', encryptedExamKey]
      ),
      query(
        'INSERT INTO encrypted_data_keys (user_id, data_type, encrypted_key) VALUES ($1, $2, $3)',
        [userId, 'vitals', encryptedVitalsKey]
      ),
      query(
        'INSERT INTO encrypted_data_keys (user_id, data_type, encrypted_key) VALUES ($1, $2, $3)',
        [userId, 'records', encryptedRecordsKey]
      )
    ]);

    // Generate JWT token
    const token = jwt.sign(
      { id: userId, emailHash },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    // Log registration
    await query(
      `INSERT INTO audit_logs (user_id, action, resource_type, ip_address, user_agent, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, 'REGISTER', 'user', req.ip, req.get('User-Agent'), new Date()]
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: userId,
        publicKey,
        createdAt: result.rows[0].created_at
      },
      // Client needs these for initial setup
      encryptedPrivateKey,
      dataKeys: {
        exam: encryptedExamKey,
        vitals: encryptedVitalsKey,
        records: encryptedRecordsKey
      }
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

    // Hash email
    const emailHash = EncryptionService.hash(email.toLowerCase());

    // Find user
    const userResult = await query(
      `SELECT id, salt, password_hash, public_key, encrypted_private_key, account_status, last_login
       FROM users WHERE email_hash = $1`,
      [emailHash]
    );

    if (userResult.rows.length === 0) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const user = userResult.rows[0];

    if (user.account_status !== 'active') {
      throw new UnauthorizedError('Account is suspended');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Get user's data keys
    const dataKeysResult = await query(
      'SELECT data_type, encrypted_key FROM encrypted_data_keys WHERE user_id = $1',
      [user.id]
    );

    const dataKeys: Record<string, string> = {};
    dataKeysResult.rows.forEach(row => {
      dataKeys[row.data_type] = row.encrypted_key;
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, emailHash },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    // Update last login
    await query(
      'UPDATE users SET last_login = $1 WHERE id = $2',
      [new Date(), user.id]
    );

    // Log login
    await query(
      `INSERT INTO audit_logs (user_id, action, resource_type, ip_address, user_agent, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [user.id, 'LOGIN', 'user', req.ip, req.get('User-Agent'), new Date()]
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        publicKey: user.public_key,
        lastLogin: user.last_login
      },
      encryptedPrivateKey: JSON.parse(user.encrypted_private_key),
      dataKeys
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

    if (token) {
      // Add token to blacklist (expires in 24h to match JWT expiry)
      await cacheSet(`blacklist:${token}`, 'true', 24 * 60 * 60);
    }

    // Log logout for audit trail
    await query(
      `INSERT INTO audit_logs (user_id, action, resource_type, ip_address, user_agent, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [user.id, 'LOGOUT', 'user', req.ip, req.get('User-Agent'), new Date()]
    );

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