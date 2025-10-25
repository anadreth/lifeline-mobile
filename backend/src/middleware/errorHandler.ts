import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface CustomError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export const errorHandler = (
  error: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error details
  logger.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.body,
    params: req.params,
    query: req.query
  });

  // Default error response
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal Server Error';
  let code = error.code || 'INTERNAL_ERROR';

  // Handle specific error types
  switch (error.name) {
    case 'ValidationError':
      statusCode = 400;
      code = 'VALIDATION_ERROR';
      break;
    
    case 'UnauthorizedError':
    case 'JsonWebTokenError':
      statusCode = 401;
      code = 'UNAUTHORIZED';
      message = 'Invalid or expired token';
      break;
    
    case 'ForbiddenError':
      statusCode = 403;
      code = 'FORBIDDEN';
      break;
    
    case 'NotFoundError':
      statusCode = 404;
      code = 'NOT_FOUND';
      break;
    
    case 'ConflictError':
      statusCode = 409;
      code = 'CONFLICT';
      break;
    
    case 'RateLimitError':
      statusCode = 429;
      code = 'RATE_LIMIT_EXCEEDED';
      break;
  }

  // Handle database errors
  if (error.code?.startsWith('23')) { // PostgreSQL constraint violations
    statusCode = 400;
    if (error.code === '23505') {
      code = 'DUPLICATE_ENTRY';
      message = 'Resource already exists';
    } else if (error.code === '23503') {
      code = 'FOREIGN_KEY_VIOLATION';
      message = 'Referenced resource does not exist';
    }
  }

  // Prepare response
  const errorResponse: any = {
    error: {
      code,
      message,
      timestamp: new Date().toISOString(),
      requestId: (req as any).id || undefined
    }
  };

  // Add validation details in development
  if (process.env.NODE_ENV === 'development' && error.details) {
    errorResponse.error.details = error.details;
  }

  // Don't expose stack trace in production
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = error.stack;
  }

  res.status(statusCode).json(errorResponse);
};

// Custom error classes
export class ValidationError extends Error {
  statusCode = 400;
  code = 'VALIDATION_ERROR';
  details: any;

  constructor(message: string, details?: any) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

export class UnauthorizedError extends Error {
  statusCode = 401;
  code = 'UNAUTHORIZED';

  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  statusCode = 403;
  code = 'FORBIDDEN';

  constructor(message: string = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends Error {
  statusCode = 404;
  code = 'NOT_FOUND';

  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  statusCode = 409;
  code = 'CONFLICT';

  constructor(message: string = 'Resource conflict') {
    super(message);
    this.name = 'ConflictError';
  }
}