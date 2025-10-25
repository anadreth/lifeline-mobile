import express from 'express';
import Joi from 'joi';
import { getPrisma } from '../config/prisma';
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
    const prisma = getPrisma();

    const result = await prisma.chatConversation.create({
      data: {
        user_id: userId,
        exam_id: examId || null,
        encrypted_messages: Buffer.from(encryptedMessages + ':' + tag, 'utf8'),
        message_count: messageCount,
      },
      select: {
        id: true,
        created_at: true,
      },
    });

    res.status(201).json({
      message: 'Chat conversation created',
      id: result.id,
      createdAt: result.created_at,
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
    const prisma = getPrisma();

    const whereCondition: any = { user_id: userId };
    if (examId) {
      whereCondition.exam_id = examId as string;
    }

    const conversationRecords = await prisma.chatConversation.findMany({
      where: whereCondition,
      orderBy: { updated_at: 'desc' },
    });

    const conversations = conversationRecords.map((row) => {
      const [encryptedMessages, tag] = Buffer.from(row.encrypted_messages).toString('utf8').split(':');

      return {
        id: row.id,
        examId: row.exam_id,
        encryptedMessages,
        tag,
        messageCount: row.message_count,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
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
    const { id } = req.params;
    const userId = (req as unknown as AuthenticatedRequest).user.id;
    const prisma = getPrisma();

    // Check if conversation exists and belongs to user
    const existing = await prisma.chatConversation.findFirst({
      where: {
        id: id,
        user_id: userId,
      },
    });

    if (!existing) {
      throw new NotFoundError('Chat conversation not found');
    }

    const result = await prisma.chatConversation.update({
      where: { id: id },
      data: {
        encrypted_messages: Buffer.from(encryptedMessages + ':' + tag, 'utf8'),
        message_count: messageCount,
        updated_at: new Date(),
      },
      select: {
        updated_at: true,
      },
    });

    res.json({
      message: 'Chat updated successfully',
      id,
      updatedAt: result.updated_at,
    });
  } catch (error) {
    next(error);
  }
});

export default router;