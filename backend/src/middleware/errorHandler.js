const { logger } = require('../utils/logger');

/**
 * Custom error class for API errors
 */
class APIError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.logAPIError(err, req);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new APIError(message, 404, 'RESOURCE_NOT_FOUND');
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `Duplicate field value: ${field}`;
    error = new APIError(message, 400, 'DUPLICATE_FIELD');
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new APIError(message, 400, 'VALIDATION_ERROR');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = new APIError(message, 401, 'INVALID_TOKEN');
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = new APIError(message, 401, 'TOKEN_EXPIRED');
  }

  // Supabase errors
  if (err.code === 'PGRST116') {
    const message = 'Resource not found';
    error = new APIError(message, 404, 'RESOURCE_NOT_FOUND');
  }

  if (err.code === 'PGRST301') {
    const message = 'Invalid request data';
    error = new APIError(message, 400, 'INVALID_REQUEST');
  }

  // Payment gateway errors
  if (err.code === 'PAYMENT_FAILED') {
    const message = 'Payment processing failed';
    error = new APIError(message, 400, 'PAYMENT_FAILED');
  }

  if (err.code === 'INSUFFICIENT_FUNDS') {
    const message = 'Insufficient funds for payment';
    error = new APIError(message, 400, 'INSUFFICIENT_FUNDS');
  }

  // AI service errors
  if (err.code === 'AI_SERVICE_ERROR') {
    const message = 'AI service temporarily unavailable';
    error = new APIError(message, 503, 'AI_SERVICE_ERROR');
  }

  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File size too large';
    error = new APIError(message, 400, 'FILE_TOO_LARGE');
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Unexpected file field';
    error = new APIError(message, 400, 'UNEXPECTED_FILE');
  }

  // Rate limiting errors
  if (err.status === 429) {
    const message = 'Too many requests, please try again later';
    error = new APIError(message, 429, 'RATE_LIMIT_EXCEEDED');
  }

  // Default error
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  const code = error.code || 'INTERNAL_ERROR';

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(statusCode).json({
    success: false,
    message: isDevelopment ? message : 'An error occurred',
    code,
    ...(isDevelopment && {
      stack: error.stack,
      details: error
    })
  });
};

/**
 * Not found handler middleware
 */
const notFoundHandler = (req, res, next) => {
  const error = new APIError(
    `Route ${req.originalUrl} not found`,
    404,
    'ROUTE_NOT_FOUND'
  );
  next(error);
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Validation error handler
 */
const validationErrorHandler = (validationResult) => {
  return (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => error.msg).join(', ');
      const error = new APIError(errorMessages, 400, 'VALIDATION_ERROR');
      return next(error);
    }
    next();
  };
};

/**
 * File upload error handler
 */
const fileUploadErrorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    let message = 'File upload error';
    let code = 'FILE_UPLOAD_ERROR';

    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File size too large';
        code = 'FILE_TOO_LARGE';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files';
        code = 'TOO_MANY_FILES';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field';
        code = 'UNEXPECTED_FILE';
        break;
      default:
        message = err.message;
    }

    const error = new APIError(message, 400, code);
    return next(error);
  }
  next(err);
};

/**
 * Database connection error handler
 */
const databaseErrorHandler = (err) => {
  logger.error('Database connection error', {
    error: err.message,
    stack: err.stack
  });

  // In production, you might want to restart the process
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
};

/**
 * Payment error handler
 */
const paymentErrorHandler = (err, req, res, next) => {
  if (err.code && err.code.startsWith('PAYMENT_')) {
    logger.error('Payment processing error', {
      userId: req.user?.id,
      error: err.message,
      code: err.code
    });

    const error = new APIError(err.message, 400, err.code);
    return next(error);
  }
  next(err);
};

/**
 * AI service error handler
 */
const aiServiceErrorHandler = (err, req, res, next) => {
  if (err.code && err.code.startsWith('AI_')) {
    logger.error('AI service error', {
      userId: req.user?.id,
      error: err.message,
      code: err.code
    });

    const error = new APIError(err.message, 503, err.code);
    return next(error);
  }
  next(err);
};

module.exports = {
  APIError,
  errorHandler,
  notFoundHandler,
  asyncHandler,
  validationErrorHandler,
  fileUploadErrorHandler,
  databaseErrorHandler,
  paymentErrorHandler,
  aiServiceErrorHandler
};