import express from 'express';
import Joi from 'joi';
import { query } from '../config/database';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { ValidationError, NotFoundError } from '../middleware/errorHandler';
import { EncryptionService } from '../utils/encryption';

const router = express.Router();
router.use(requireAuth);

const chatSchema = Joi.object({
  examId: Joi.string().uuid().optional(),
  encryptedMessages: Joi.string().required(),
  nonce: Joi.string().required(),
  tag: Joi.string().required(),
  messageCount: Joi.number().integer().min(0).required()
});

// Create new chat conversation
router.post('/', async (req, res, next) => {
  try {
    const { error, value } = chatSchema.validate(req.body);
    if (error) {
      throw new ValidationError('Invalid input', error.details);
    }

    const { examId, encryptedMessages, nonce, tag, messageCount } = value;
    const userId = (req as AuthenticatedRequest).user.id;

    const result = await query(
      `INSERT INTO chat_conversations 
       (user_id, exam_id, encrypted_messages, message_count)
       VALUES ($1, $2, $3, $4)
       RETURNING id, created_at`,
      [
        userId,
        examId || null,
        Buffer.from(encryptedMessages + ':' + tag, 'utf8'),
        messageCount
      ]
    );

    res.status(201).json({
      message: 'Chat conversation created',
      id: result.rows[0].id,
      createdAt: result.rows[0].created_at
    });

  } catch (error) {
    next(error);
  }
});

// Get chat conversations
router.get('/', async (req, res, next) => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const { examId } = req.query;

    let queryText = `
      SELECT id, exam_id, encrypted_messages, message_count, created_at, updated_at
      FROM chat_conversations 
      WHERE user_id = $1
    `;
    const queryParams = [userId];

    if (examId) {
      queryText += ' AND exam_id = $2';
      queryParams.push(examId as string);
    }

    queryText += ' ORDER BY updated_at DESC';

    const result = await query(queryText, queryParams);

    const conversations = result.rows.map(row => {
      const [encryptedMessages, tag] = row.encrypted_messages.toString('utf8').split(':');
      
      return {
        id: row.id,
        examId: row.exam_id,
        encryptedMessages,
        tag,
        messageCount: row.message_count,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    });

    res.json(conversations);

  } catch (error) {
    next(error);
  }
});

// Update chat conversation
router.put('/:id', async (req, res, next) => {
  try {
    const { error, value } = chatSchema.validate(req.body);
    if (error) {
      throw new ValidationError('Invalid input', error.details);
    }

    const { encryptedMessages, tag, messageCount } = value;
    const userId = (req as AuthenticatedRequest).user.id;
    const { id } = req.params;

    const result = await query(
      `UPDATE chat_conversations 
       SET encrypted_messages = $1, message_count = $2, updated_at = $3
       WHERE id = $4 AND user_id = $5
       RETURNING updated_at`,
      [
        Buffer.from(encryptedMessages + ':' + tag, 'utf8'),
        messageCount,
        new Date(),
        id,
        userId
      ]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Chat conversation not found');
    }

    res.json({
      message: 'Chat updated successfully',
      id,
      updatedAt: result.rows[0].updated_at
    });

  } catch (error) {
    next(error);
  }
});

export default router;