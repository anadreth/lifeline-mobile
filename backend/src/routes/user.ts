import express from 'express';
import { query } from '../config/database';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { EncryptionService } from '../utils/encryption';

const router = express.Router();
router.use(requireAuth);

// Get user profile
router.get('/profile', async (req, res, next) => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;

    const result = await query(
      `SELECT id, public_key, created_at, last_login, account_status
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    res.json({
      id: user.id,
      publicKey: user.public_key,
      createdAt: user.created_at,
      lastLogin: user.last_login,
      accountStatus: user.account_status
    });

  } catch (error) {
    next(error);
  }
});

// Get user's encrypted data keys
router.get('/keys', async (req, res, next) => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;

    const result = await query(
      'SELECT data_type, encrypted_key, key_version FROM encrypted_data_keys WHERE user_id = $1',
      [userId]
    );

    const keys: Record<string, any> = {};
    result.rows.forEach(row => {
      keys[row.data_type] = {
        encryptedKey: row.encrypted_key,
        version: row.key_version
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

    // Get all user data (still encrypted)
    const [userData, healthData, chatData, auditData] = await Promise.all([
      query('SELECT created_at, last_login, account_status FROM users WHERE id = $1', [userId]),
      query('SELECT id, data_type, created_at, updated_at FROM encrypted_health_data WHERE user_id = $1', [userId]),
      query('SELECT id, created_at, updated_at, message_count FROM chat_conversations WHERE user_id = $1', [userId]),
      query('SELECT action, resource_type, timestamp FROM audit_logs WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 100', [userId])
    ]);

    const exportData = {
      user: userData.rows[0],
      healthData: healthData.rows,
      chatData: chatData.rows,
      recentActivity: auditData.rows,
      exportDate: new Date().toISOString(),
      note: 'All health data remains encrypted and can only be decrypted with your private key'
    };

    // Log the export
    await query(
      `INSERT INTO audit_logs (user_id, action, resource_type, ip_address, user_agent, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, 'EXPORT', 'user_data', req.ip, req.get('User-Agent'), new Date()]
    );

    res.json(exportData);

  } catch (error) {
    next(error);
  }
});

// Delete user account (GDPR right to be forgotten)
router.delete('/account', async (req, res, next) => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;

    // Start transaction
    const client = await query('BEGIN');

    try {
      // Delete in correct order due to foreign key constraints
      await query('DELETE FROM chat_conversations WHERE user_id = $1', [userId]);
      await query('DELETE FROM data_sharing_permissions WHERE data_owner_id = $1 OR shared_with_user_id = $1', [userId]);
      await query('DELETE FROM encrypted_health_data WHERE user_id = $1', [userId]);
      await query('DELETE FROM encrypted_data_keys WHERE user_id = $1', [userId]);
      await query('DELETE FROM user_sessions WHERE user_id = $1', [userId]);
      
      // Keep audit logs but anonymize them
      await query('UPDATE audit_logs SET user_id = NULL WHERE user_id = $1', [userId]);
      
      // Finally delete the user
      await query('DELETE FROM users WHERE id = $1', [userId]);

      await query('COMMIT');

      res.json({
        message: 'Account deleted successfully',
        deletedAt: new Date().toISOString()
      });

    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    next(error);
  }
});

export default router;