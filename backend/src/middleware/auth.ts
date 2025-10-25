import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';
import { UnauthorizedError, ForbiddenError } from './errorHandler';
import { logger } from '../utils/logger';
import { cacheGet, cacheSet } from '../config/redis';

export interface UserPayload {
  id: string;
  emailHash: string;
  publicKey?: string;
}

export interface AuthenticatedRequest extends Request {
  user: UserPayload;
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      throw new UnauthorizedError('Access token required');
    }

    // Check if token is blacklisted (logout)
    const blacklisted = await cacheGet(`blacklist:${token}`);
    if (blacklisted) {
      throw new UnauthorizedError('Token has been revoked');
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Check if user still exists and is active
    const userResult = await query(
      'SELECT id, email_hash, public_key, account_status FROM users WHERE id = $1',
      [decoded.id]
    );

    if (userResult.rows.length === 0) {
      throw new UnauthorizedError('User not found');
    }

    const user = userResult.rows[0];
    
    if (user.account_status !== 'active') {
      throw new ForbiddenError('Account is suspended or deleted');
    }

    // Add user to request object
    (req as AuthenticatedRequest).user = {
      id: user.id,
      emailHash: user.email_hash,
      publicKey: user.public_key
    };

    // Log access for audit
    await logUserAccess(req, user.id);

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Invalid token'));
    } else {
      next(error);
    }
  }
};

export const requireAuth = authenticateToken;

// Optional auth - doesn't fail if no token provided
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      await authenticateToken(req, res, next);
    } else {
      next();
    }
  } catch (error) {
    // For optional auth, continue even if token is invalid
    next();
  }
};

// Middleware to validate request signature (for sensitive operations)
export const validateSignature = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const signature = req.headers['x-signature'] as string;
    const user = (req as AuthenticatedRequest).user;

    if (!signature) {
      throw new UnauthorizedError('Request signature required');
    }

    if (!user?.publicKey) {
      throw new UnauthorizedError('User public key not found');
    }

    // Here you would implement signature validation
    // For now, we'll skip the actual crypto verification
    // In production, verify the request body signature with user's public key

    next();
  } catch (error) {
    next(error);
  }
};

// Rate limiting per user
export const userRateLimit = (maxRequests: number, windowMs: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      if (!user) {
        return next();
      }

      const key = `rate_limit:${user.id}`;
      const current = await cacheGet(key);
      
      if (current && parseInt(current) >= maxRequests) {
        throw new Error('Rate limit exceeded for user');
      }

      // Increment counter
      const newCount = current ? parseInt(current) + 1 : 1;
      await cacheSet(key, newCount.toString(), windowMs / 1000);

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Log user access for audit trail
const logUserAccess = async (req: Request, userId: string) => {
  try {
    await query(
      `INSERT INTO audit_logs (user_id, action, resource_type, ip_address, user_agent, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        userId,
        'ACCESS',
        `${req.method} ${req.path}`,
        req.ip,
        req.get('User-Agent'),
        new Date()
      ]
    );
  } catch (error) {
    logger.error('Failed to log user access:', error);
    // Don't fail the request if audit logging fails
  }
};