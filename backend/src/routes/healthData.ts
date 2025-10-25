import express from 'express';
import Joi from 'joi';
import { query } from '../config/database';
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
    const userId = (req as AuthenticatedRequest).user.id;

    // Get or create data key for this data type
    let dataKeyResult = await query(
      'SELECT id FROM encrypted_data_keys WHERE user_id = $1 AND data_type = $2',
      [userId, dataType]
    );

    let dataKeyId: string;

    if (dataKeyResult.rows.length === 0) {
      // Create new data key if doesn't exist
      const user = await query('SELECT public_key FROM users WHERE id = $1', [userId]);
      if (user.rows.length === 0) {
        throw new NotFoundError('User not found');
      }

      const newDataKey = EncryptionService.generateKey();
      const encryptedDataKey = EncryptionService.encryptWithRSA(newDataKey, user.rows[0].public_key);

      const newKeyResult = await query(
        'INSERT INTO encrypted_data_keys (user_id, data_type, encrypted_key) VALUES ($1, $2, $3) RETURNING id',
        [userId, dataType, encryptedDataKey]
      );

      dataKeyId = newKeyResult.rows[0].id;
    } else {
      dataKeyId = dataKeyResult.rows[0].id;
    }

    // Store encrypted health data
    const result = await query(
      `INSERT INTO encrypted_health_data 
       (user_id, data_type, encrypted_payload, metadata_encrypted, data_key_id, nonce)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, created_at`,
      [
        userId,
        dataType,
        Buffer.from(encryptedPayload + ':' + tag, 'utf8'), // Store payload and tag together
        metadata ? Buffer.from(JSON.stringify(metadata), 'utf8') : null,
        dataKeyId,
        nonce
      ]
    );

    // Log the creation
    await query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id_hash, ip_address, user_agent, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        userId,
        'CREATE',
        dataType,
        EncryptionService.hash(result.rows[0].id),
        req.ip,
        req.get('User-Agent'),
        new Date()
      ]
    );

    res.status(201).json({
      message: 'Health data stored successfully',
      id: result.rows[0].id,
      createdAt: result.rows[0].created_at,
      dataType
    });

  } catch (error) {
    next(error);
  }
});

// Get all health data for user
router.get('/', async (req, res, next) => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const { dataType, limit = 50, offset = 0 } = req.query;

    let queryText = `
      SELECT hd.id, hd.data_type, hd.encrypted_payload, hd.metadata_encrypted, 
             hd.nonce, hd.created_at, hd.updated_at, dk.encrypted_key as data_key
      FROM encrypted_health_data hd
      LEFT JOIN encrypted_data_keys dk ON hd.data_key_id = dk.id
      WHERE hd.user_id = $1
    `;
    const queryParams: any[] = [userId];

    // Filter by data type if provided
    if (dataType) {
      queryText += ' AND hd.data_type = $2';
      queryParams.push(dataType);
    }

    queryText += ' ORDER BY hd.created_at DESC LIMIT $' + (queryParams.length + 1) + ' OFFSET $' + (queryParams.length + 2);
    queryParams.push(Number(limit), Number(offset));

    const result = await query(queryText, queryParams);

    // Process results to separate encrypted payload and tag
    const healthData = result.rows.map(row => {
      const [encryptedPayload, tag] = row.encrypted_payload.toString('utf8').split(':');
      
      return {
        id: row.id,
        dataType: row.data_type,
        encryptedPayload,
        tag,
        nonce: row.nonce,
        encryptedDataKey: row.data_key,
        metadata: row.metadata_encrypted ? JSON.parse(row.metadata_encrypted.toString('utf8')) : null,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    });

    // Log the read access
    await query(
      `INSERT INTO audit_logs (user_id, action, resource_type, ip_address, user_agent, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, 'READ', 'health_data_list', req.ip, req.get('User-Agent'), new Date()]
    );

    res.json({
      data: healthData,
      pagination: {
        limit: Number(limit),
        offset: Number(offset),
        total: result.rows.length
      }
    });

  } catch (error) {
    next(error);
  }
});

// Get specific health data by ID
router.get('/:id', async (req, res, next) => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const { id } = req.params;

    const result = await query(
      `SELECT hd.id, hd.data_type, hd.encrypted_payload, hd.metadata_encrypted, 
              hd.nonce, hd.created_at, hd.updated_at, dk.encrypted_key as data_key
       FROM encrypted_health_data hd
       LEFT JOIN encrypted_data_keys dk ON hd.data_key_id = dk.id
       WHERE hd.id = $1 AND hd.user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Health data not found');
    }

    const row = result.rows[0];
    const [encryptedPayload, tag] = row.encrypted_payload.toString('utf8').split(':');

    const healthData = {
      id: row.id,
      dataType: row.data_type,
      encryptedPayload,
      tag,
      nonce: row.nonce,
      encryptedDataKey: row.data_key,
      metadata: row.metadata_encrypted ? JSON.parse(row.metadata_encrypted.toString('utf8')) : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };

    // Log the access
    await query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id_hash, ip_address, user_agent, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, 'READ', row.data_type, EncryptionService.hash(id), req.ip, req.get('User-Agent'), new Date()]
    );

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
    const userId = (req as AuthenticatedRequest).user.id;
    const { id } = req.params;

    // Check if the health data exists and belongs to the user
    const existingData = await query(
      'SELECT id, data_type FROM encrypted_health_data WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (existingData.rows.length === 0) {
      throw new NotFoundError('Health data not found');
    }

    // Update the health data
    const result = await query(
      `UPDATE encrypted_health_data 
       SET encrypted_payload = $1, metadata_encrypted = $2, nonce = $3, updated_at = $4
       WHERE id = $5 AND user_id = $6
       RETURNING updated_at`,
      [
        Buffer.from(encryptedPayload + ':' + tag, 'utf8'),
        metadata ? Buffer.from(JSON.stringify(metadata), 'utf8') : null,
        nonce,
        new Date(),
        id,
        userId
      ]
    );

    // Log the update
    await query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id_hash, ip_address, user_agent, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        userId,
        'UPDATE',
        existingData.rows[0].data_type,
        EncryptionService.hash(id),
        req.ip,
        req.get('User-Agent'),
        new Date()
      ]
    );

    res.json({
      message: 'Health data updated successfully',
      id,
      updatedAt: result.rows[0].updated_at
    });

  } catch (error) {
    next(error);
  }
});

// Delete health data
router.delete('/:id', async (req, res, next) => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const { id } = req.params;

    // Check if the health data exists and belongs to the user
    const existingData = await query(
      'SELECT id, data_type FROM encrypted_health_data WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (existingData.rows.length === 0) {
      throw new NotFoundError('Health data not found');
    }

    // Delete the health data
    await query(
      'DELETE FROM encrypted_health_data WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    // Also delete any sharing permissions for this data
    await query(
      'DELETE FROM data_sharing_permissions WHERE data_id = $1',
      [id]
    );

    // Log the deletion
    await query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id_hash, ip_address, user_agent, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        userId,
        'DELETE',
        existingData.rows[0].data_type,
        EncryptionService.hash(id),
        req.ip,
        req.get('User-Agent'),
        new Date()
      ]
    );

    res.json({
      message: 'Health data deleted successfully',
      id
    });

  } catch (error) {
    next(error);
  }
});

export default router;