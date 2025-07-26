const winston = require('winston');
require('winston-daily-rotate-file');

// Define log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Define colors for each log level
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

// Add colors to winston
winston.addColors(logColors);

// Create log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss:ms'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    
    let logMessage = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      logMessage += ` ${JSON.stringify(meta)}`;
    }
    
    return logMessage;
  })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    
    let logMessage = `${timestamp} [${level}]: ${message}`;
    
    // Add metadata if present
    if (Object.keys(meta).length > 0 && meta.stack) {
      logMessage += `\n${meta.stack}`;
    } else if (Object.keys(meta).length > 0) {
      logMessage += ` ${JSON.stringify(meta, null, 2)}`;
    }
    
    return logMessage;
  })
);

// Create transports array
const transports = [];

// Console transport for development
if (process.env.NODE_ENV === 'development') {
  transports.push(
    new winston.transports.Console({
      level: 'debug',
      format: consoleFormat
    })
  );
} else {
  // Console transport for production (less verbose)
  transports.push(
    new winston.transports.Console({
      level: 'info',
      format: logFormat
    })
  );
}

// File transport for errors
transports.push(
  new winston.transports.DailyRotateFile({
    filename: 'logs/error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    format: logFormat,
    maxSize: '20m',
    maxFiles: '14d',
    createSymlink: true,
    symlinkName: 'error.log'
  })
);

// File transport for all logs
transports.push(
  new winston.transports.DailyRotateFile({
    filename: 'logs/app-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    format: logFormat,
    maxSize: '20m',
    maxFiles: '14d',
    createSymlink: true,
    symlinkName: 'app.log'
  })
);

// File transport for HTTP requests
transports.push(
  new winston.transports.DailyRotateFile({
    filename: 'logs/http-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    level: 'http',
    format: logFormat,
    maxSize: '20m',
    maxFiles: '7d',
    createSymlink: true,
    symlinkName: 'http.log'
  })
);

// Create logger instance
const logger = winston.createLogger({
  levels: logLevels,
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'development' ? 'debug' : 'info'),
  format: logFormat,
  transports,
  exceptionHandlers: [
    new winston.transports.DailyRotateFile({
      filename: 'logs/exceptions-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d'
    })
  ],
  rejectionHandlers: [
    new winston.transports.DailyRotateFile({
      filename: 'logs/rejections-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d'
    })
  ]
});

// Add HTTP logging method
logger.http = (message, meta) => {
  logger.log('http', message, meta);
};

// Add request logging helper
logger.logRequest = (req, res, responseTime) => {
  const { method, url, ip, headers } = req;
  const userAgent = headers['user-agent'] || 'Unknown';
  const statusCode = res.statusCode;
  
  logger.http('HTTP Request', {
    method,
    url,
    ip,
    userAgent,
    statusCode,
    responseTime: `${responseTime}ms`
  });
};

// Add authentication logging helpers
logger.logAuth = (action, userId, email, ip, success = true, error = null) => {
  const level = success ? 'info' : 'warn';
  const message = `Auth: ${action} ${success ? 'successful' : 'failed'}`;
  
  logger.log(level, message, {
    action,
    userId,
    email,
    ip,
    success,
    error: error ? error.message : null
  });
};

// Add payment logging helpers
logger.logPayment = (action, userId, amount, paymentMethod, success = true, error = null) => {
  const level = success ? 'info' : 'error';
  const message = `Payment: ${action} ${success ? 'successful' : 'failed'}`;
  
  logger.log(level, message, {
    action,
    userId,
    amount,
    paymentMethod,
    success,
    error: error ? error.message : null
  });
};

// Add SMS logging helpers
logger.logSMS = (action, phoneNumber, success = true, error = null) => {
  const level = success ? 'info' : 'error';
  const message = `SMS: ${action} ${success ? 'sent' : 'failed'}`;
  
  // Mask phone number for privacy (show only last 4 digits)
  const maskedPhone = phoneNumber ? 
    phoneNumber.replace(/(\+221)(.*)(.{4})/, '$1***$3') : 
    'Unknown';
  
  logger.log(level, message, {
    action,
    phoneNumber: maskedPhone,
    success,
    error: error ? error.message : null
  });
};

// Add database logging helpers
logger.logDatabase = (action, table, recordId, success = true, error = null) => {
  const level = success ? 'debug' : 'error';
  const message = `Database: ${action} on ${table} ${success ? 'successful' : 'failed'}`;
  
  logger.log(level, message, {
    action,
    table,
    recordId,
    success,
    error: error ? error.message : null
  });
};

// Add security logging helpers
logger.logSecurity = (event, userId, ip, details = {}) => {
  logger.warn(`Security: ${event}`, {
    event,
    userId,
    ip,
    timestamp: new Date().toISOString(),
    ...details
  });
};

// Add performance logging helpers
logger.logPerformance = (operation, duration, details = {}) => {
  const level = duration > 1000 ? 'warn' : 'debug';
  logger.log(level, `Performance: ${operation} took ${duration}ms`, {
    operation,
    duration,
    ...details
  });
};

// Stream interface for Morgan HTTP logger
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  }
};

// Graceful shutdown
const gracefulShutdown = () => {
  logger.info('Logger shutting down gracefully...');
  logger.end();
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

module.exports = logger;