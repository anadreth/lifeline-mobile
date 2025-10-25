import express from 'express';
import Joi from 'joi';
import { getPrisma } from '../config/prisma';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { ValidationError, NotFoundError } from '../middleware/errorHandler';
import { EncryptionService } from '../utils/encryption';
import { logger } from '../utils/logger';

const router = express.Router();

// Apply authentication to all routes
router.use(requireAuth);

// Validation schemas
const healthDataSchema = Joi.object({
  dataType: Joi.string().valid('exam', 'vitals', 'records', 'anamnesis').required(),
  encryptedPayload: Joi.string().required(),
  nonce: Joi.string().required(),
  tag: Joi.string().required(),
  metadata: Joi.object().optional()
});

const updateHealthDataSchema = Joi.object({
  encryptedPayload: Joi.string().required(),
  nonce: Joi.string().required(),
  tag: Joi.string().required(),
  metadata: Joi.object().optional()
});

// Create new health data
router.post('/', async (req, res, next) => {
  try {
    // Validate input
    const { error, value } = healthDataSchema.validate(req.body);
    if (error) {
      throw new ValidationError('Invalid input', error.details);
    }

    const { dataType, encryptedPayload, nonce, tag, metadata } = value;
    const userId = (req as unknown as AuthenticatedRequest).user.id;
    const prisma = getPrisma();

    // Get or create data key for this data type
    let dataKey = await prisma.encryptedDataKey.findFirst({
      where: {
        user_id: userId,
        data_type: dataType,
      },
    });

    if (!dataKey) {
      // Create new data key if doesn't exist
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { public_key: true },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      const newDataKey = EncryptionService.generateKey();
      const encryptedDataKey = EncryptionService.encryptWithRSA(newDataKey, user.public_key);

      dataKey = await prisma.encryptedDataKey.create({
        data: {
          user_id: userId,
          data_type: dataType,
          encrypted_key: Buffer.from(encryptedDataKey),
        },
      });
    }

    // Store encrypted health data
    const result = await prisma.encryptedHealthData.create({
      data: {
        user_id: userId,
        data_type: dataType,
        encrypted_payload: Buffer.from(encryptedPayload + ':' + tag, 'utf8'),
        metadata_encrypted: metadata ? Buffer.from(JSON.stringify(metadata), 'utf8') : null,
        data_key_id: dataKey.id,
        nonce: nonce,
      },
      select: {
        id: true,
        created_at: true,
      },
    });

    // Log the creation
    await prisma.auditLog.create({
      data: {
        user_id: userId,
        action: 'CREATE',
        resource_type: dataType,
        resource_id_hash: EncryptionService.hash(result.id),
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        timestamp: new Date(),
      },
    });

    res.status(201).json({
      message: 'Health data stored successfully',
      id: result.id,
      createdAt: result.created_at,
      dataType,
    });
  } catch (error) {
    next(error);
  }
});

// Get all health data for user
router.get('/', async (req, res, next) => {
  try {
    const userId = (req as unknown as AuthenticatedRequest).user.id;
    const { dataType, limit = 50, offset = 0 } = req.query;
    const prisma = getPrisma();

    const whereCondition: any = { user_id: userId };
    if (dataType) {
      whereCondition.data_type = dataType as string;
    }

    const healthDataRecords = await prisma.encryptedHealthData.findMany({
      where: whereCondition,
      include: {
        data_key: {
          select: {
            encrypted_key: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      take: Number(limit),
      skip: Number(offset),
    });

    // Process results to separate encrypted payload and tag
    const healthData = healthDataRecords.map((row) => {
      const [encryptedPayload, tag] = Buffer.from(row.encrypted_payload).toString('utf8').split(':');

      return {
        id: row.id,
        dataType: row.data_type,
        encryptedPayload,
        tag,
        nonce: row.nonce,
        encryptedDataKey: Buffer.from(row.data_key.encrypted_key).toString('base64'),
        metadata: row.metadata_encrypted ? JSON.parse(Buffer.from(row.metadata_encrypted).toString('utf8')) : null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });

    // Log the read access
    await prisma.auditLog.create({
      data: {
        user_id: userId,
        action: 'READ',
        resource_type: 'health_data_list',
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        timestamp: new Date(),
      },
    });

    res.json({
      data: healthData,
      pagination: {
        limit: Number(limit),
        offset: Number(offset),
        total: healthData.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get specific health data by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = (req as unknown as AuthenticatedRequest).user.id;
    const prisma = getPrisma();

    const record = await prisma.encryptedHealthData.findFirst({
      where: {
        id: id,
        user_id: userId,
      },
      include: {
        data_key: {
          select: {
            encrypted_key: true,
          },
        },
      },
    });

    if (!record) {
      throw new NotFoundError('Health data not found');
    }

    const [encryptedPayload, tag] = Buffer.from(record.encrypted_payload).toString('utf8').split(':');

    const healthData = {
      id: record.id,
      dataType: record.data_type,
      encryptedPayload,
      tag,
      nonce: record.nonce,
      encryptedDataKey: Buffer.from(record.data_key.encrypted_key).toString('base64'),
      metadata: record.metadata_encrypted ? JSON.parse(Buffer.from(record.metadata_encrypted).toString('utf8')) : null,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };

    // Log the access
    await prisma.auditLog.create({
      data: {
        user_id: userId,
        action: 'READ',
        resource_type: record.data_type,
        resource_id_hash: EncryptionService.hash(id),
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        timestamp: new Date(),
      },
    });

    res.json(healthData);
  } catch (error) {
    next(error);
  }
});

// Update health data
router.put('/:id', async (req, res, next) => {
  try {
    // Validate input
    const { error, value } = updateHealthDataSchema.validate(req.body);
    if (error) {
      throw new ValidationError('Invalid input', error.details);
    }

    const { encryptedPayload, nonce, tag, metadata } = value;
    const { id } = req.params;
    const userId = (req as unknown as AuthenticatedRequest).user.id;
    const prisma = getPrisma();

    // Check if the health data exists and belongs to the user
    const existingData = await prisma.encryptedHealthData.findFirst({
      where: {
        id: id,
        user_id: userId,
      },
      select: {
        id: true,
        data_type: true,
      },
    });

    if (!existingData) {
      throw new NotFoundError('Health data not found');
    }

    // Update the health data
    const result = await prisma.encryptedHealthData.update({
      where: { id: id },
      data: {
        encrypted_payload: Buffer.from(encryptedPayload + ':' + tag, 'utf8'),
        metadata_encrypted: metadata ? Buffer.from(JSON.stringify(metadata), 'utf8') : null,
        nonce: nonce,
        updated_at: new Date(),
      },
      select: {
        updated_at: true,
      },
    });

    // Log the update
    await prisma.auditLog.create({
      data: {
        user_id: userId,
        action: 'UPDATE',
        resource_type: existingData.data_type,
        resource_id_hash: EncryptionService.hash(id),
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        timestamp: new Date(),
      },
    });

    res.json({
      message: 'Health data updated successfully',
      id,
      updatedAt: result.updated_at,
    });
  } catch (error) {
    next(error);
  }
});

// Delete health data
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = (req as unknown as AuthenticatedRequest).user.id;
    const prisma = getPrisma();

    // Check if the health data exists and belongs to the user
    const existingData = await prisma.encryptedHealthData.findFirst({
      where: {
        id: id,
        user_id: userId,
      },
      select: {
        id: true,
        data_type: true,
      },
    });

    if (!existingData) {
      throw new NotFoundError('Health data not found');
    }

    // Delete the health data and related sharing permissions
    await prisma.$transaction([
      prisma.dataSharingPermission.deleteMany({
        where: { data_id: id },
      }),
      prisma.encryptedHealthData.delete({
        where: { id: id },
      }),
    ]);

    // Log the deletion
    await prisma.auditLog.create({
      data: {
        user_id: userId,
        action: 'DELETE',
        resource_type: existingData.data_type,
        resource_id_hash: EncryptionService.hash(id),
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        timestamp: new Date(),
      },
    });

    res.json({
      message: 'Health data deleted successfully',
      id,
    });
  } catch (error) {
    next(error);
  }
});

export default router;