import winston from 'winston';
import path from 'path';
import fs from 'fs';
import config from '../core/config';

// Ensure log directory exists
const logDir = path.resolve(config.logging.filePath);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} ${level}: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta, null, 2)}`;
    }
    return msg;
  })
);

// Custom format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: config.logging.level,
  transports: [
    // Console transport
    new winston.transports.Console({
      format: consoleFormat,
    }),
    // File transport for all logs
    new winston.transports.File({
      filename: path.join(logDir, 'app.log'),
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // File transport for errors only
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
  exitOnError: false,
});

// Add metadata to all logs
logger.defaultMeta = { service: 'google-maps-scraper' };

// Helper functions for structured logging
export const logScrapeStart = (city: string, businessType: string, workers: number) => {
  logger.info('Scraping started', {
    city,
    businessType,
    workers,
    timestamp: new Date().toISOString(),
  });
};

export const logScrapeComplete = (
  city: string,
  businessType: string,
  totalBusiness: number,
  duration: number
) => {
  logger.info('Scraping completed', {
    city,
    businessType,
    totalBusiness,
    duration,
    businessPerSecond: totalBusiness / (duration / 1000),
    timestamp: new Date().toISOString(),
  });
};

export const logBusinessFound = (businessData: any) => {
  logger.debug('Business found', {
    name: businessData.businessName,
    hasWebsite: businessData.hasWebsite,
    city: businessData.city,
  });
};

export const logError = (error: Error, context?: any) => {
  logger.error('Error occurred', {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  });
};

export const logRateLimit = (delay: number) => {
  logger.warn('Rate limit detected, applying delay', {
    delay,
    timestamp: new Date().toISOString(),
  });
};

export const logProxyRotation = (oldProxy: string, newProxy: string) => {
  logger.info('Proxy rotated', {
    oldProxy: oldProxy || 'none',
    newProxy,
    timestamp: new Date().toISOString(),
  });
};

export default logger;