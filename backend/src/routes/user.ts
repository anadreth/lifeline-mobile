import express from 'express';
import { getPrisma } from '../config/prisma';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { EncryptionService } from '../utils/encryption';

const router = express.Router();
router.use(requireAuth);

// Get user profile
router.get('/profile', async (req, res, next) => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const prisma = getPrisma();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        public_key: true,
        created_at: true,
        last_login: true,
        account_status: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      id: user.id,
      publicKey: user.public_key,
      createdAt: user.created_at,
      lastLogin: user.last_login,
      accountStatus: user.account_status,
    });
  } catch (error) {
    return next(error);
  }
});

// Get user's encrypted data keys
router.get('/keys', async (req, res, next) => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const prisma = getPrisma();

    const dataKeys = await prisma.encryptedDataKey.findMany({
      where: { user_id: userId },
      select: {
        data_type: true,
        encrypted_key: true,
        key_version: true,
      },
    });

    const keys: Record<string, any> = {};
    dataKeys.forEach((row) => {
      keys[row.data_type] = {
        encryptedKey: Buffer.from(row.encrypted_key).toString('base64'),
        version: row.key_version,
      };
    });

    res.json(keys);
  } catch (error) {
    next(error);
  }
});

// Export user data (GDPR compliance)
router.get('/export', async (req, res, next) => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const prisma = getPrisma();

    // Get all user data (still encrypted)
    const [userData, healthData, chatData, auditData] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          created_at: true,
          last_login: true,
          account_status: true,
        },
      }),
      prisma.encryptedHealthData.findMany({
        where: { user_id: userId },
        select: {
          id: true,
          data_type: true,
          created_at: true,
          updated_at: true,
        },
      }),
      prisma.chatConversation.findMany({
        where: { user_id: userId },
        select: {
          id: true,
          created_at: true,
          updated_at: true,
          message_count: true,
        },
      }),
      prisma.auditLog.findMany({
        where: { user_id: userId },
        select: {
          action: true,
          resource_type: true,
          timestamp: true,
        },
        orderBy: { timestamp: 'desc' },
        take: 100,
      }),
    ]);

    const exportData = {
      user: userData,
      healthData: healthData,
      chatData: chatData,
      recentActivity: auditData,
      exportDate: new Date().toISOString(),
      note: 'All health data remains encrypted and can only be decrypted with your private key',
    };

    // Log the export
    await prisma.auditLog.create({
      data: {
        user_id: userId,
        action: 'EXPORT',
        resource_type: 'user_data',
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        timestamp: new Date(),
      },
    });

    res.json(exportData);
  } catch (error) {
    next(error);
  }
});

// Delete user account (GDPR right to be forgotten)
router.delete('/account', async (req, res, next) => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const prisma = getPrisma();

    // Start transaction
    await prisma.$transaction(async (tx) => {
      // Keep audit logs but anonymize them
      await tx.auditLog.updateMany({
        where: { user_id: userId },
        data: { user_id: null },
      });

      // Delete user (cascading deletes will handle related records due to onDelete: Cascade in schema)
      await tx.user.delete({
        where: { id: userId },
      });
    });

    res.json({
      message: 'Account deleted successfully',
      deletedAt: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

export default router;