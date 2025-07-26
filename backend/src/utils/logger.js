const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Define which level to log based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// Define format for logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }),
  
  // File transport for errors
  new DailyRotateFile({
    filename: path.join(__dirname, '../../logs/error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxSize: '20m',
    maxFiles: '14d',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  }),
  
  // File transport for all logs
  new DailyRotateFile({
    filename: path.join(__dirname, '../../logs/combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  })
];

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
  exitOnError: false,
});

// Create a stream object for Morgan
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

// Helper functions for structured logging
logger.logAPIRequest = (req, res, responseTime) => {
  logger.info('API Request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    responseTime: `${responseTime}ms`,
    statusCode: res.statusCode
  });
};

logger.logAPIError = (error, req) => {
  logger.error('API Error', {
    message: error.message,
    stack: error.stack,
    method: req?.method,
    url: req?.url,
    ip: req?.ip,
    userId: req?.user?.id,
    timestamp: new Date().toISOString()
  });
};

logger.logPaymentTransaction = (transaction) => {
  logger.info('Payment Transaction', {
    transactionId: transaction.id,
    userId: transaction.user_id,
    amount: transaction.amount_xof,
    currency: transaction.currency,
    paymentMethod: transaction.payment_method,
    status: transaction.status,
    timestamp: new Date().toISOString()
  });
};

logger.logWorkoutSession = (session) => {
  logger.info('Workout Session', {
    sessionId: session.id,
    userId: session.user_id,
    duration: session.duration_minutes,
    caloriesBurned: session.calories_burned,
    status: session.status,
    timestamp: new Date().toISOString()
  });
};

logger.logAIGeneration = (type, userId, confidence) => {
  logger.info('AI Generation', {
    type,
    userId,
    confidence,
    timestamp: new Date().toISOString()
  });
};

logger.logUserAction = (action, userId, details = {}) => {
  logger.info('User Action', {
    action,
    userId,
    details,
    timestamp: new Date().toISOString()
  });
};

module.exports = { logger };