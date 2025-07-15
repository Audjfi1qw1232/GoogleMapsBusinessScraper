import dotenv from 'dotenv';
import Joi from 'joi';

dotenv.config();

const configSchema = Joi.object({
  // Scraping Configuration
  scraping: Joi.object({
    headless: Joi.boolean().default(true),
    defaultWorkers: Joi.number().min(1).max(10).default(3),
    timeout: Joi.number().min(10000).default(30000),
    maxRetries: Joi.number().min(0).default(3),
    stealthMode: Joi.boolean().default(true),
    randomizeViewport: Joi.boolean().default(true),
    randomizeUserAgent: Joi.boolean().default(true),
    simulateHumanBehavior: Joi.boolean().default(true),
  }),

  // Rate Limiting
  rateLimiting: Joi.object({
    minDelay: Joi.number().min(1000).default(2000),
    maxDelay: Joi.number().min(1000).default(8000),
    rateLimitPause: Joi.number().min(10000).default(60000),
  }),

  // Storage
  storage: Joi.object({
    exportPath: Joi.string().default('./exports'),
    bufferSize: Joi.number().min(1).default(10),
    backupEnabled: Joi.boolean().default(true),
  }),

  // Google Maps API
  googleMaps: Joi.object({
    apiKey: Joi.string().allow('').default(''),
    useApiFallback: Joi.boolean().default(false),
  }),

  // Proxy Configuration
  proxy: Joi.object({
    url: Joi.string().allow('').default(''),
    username: Joi.string().allow('').default(''),
    password: Joi.string().allow('').default(''),
    rotateProxies: Joi.boolean().default(false),
  }),

  // Logging
  logging: Joi.object({
    level: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
    filePath: Joi.string().default('./logs'),
    enableScreenshots: Joi.boolean().default(true),
  }),
});

const parseBoolean = (value: string | undefined): boolean => {
  return value?.toLowerCase() === 'true';
};

const parseNumber = (value: string | undefined, defaultValue: number): number => {
  const num = parseInt(value || '', 10);
  return isNaN(num) ? defaultValue : num;
};

const rawConfig = {
  scraping: {
    headless: parseBoolean(process.env.HEADLESS),
    defaultWorkers: parseNumber(process.env.DEFAULT_WORKERS, 3),
    timeout: parseNumber(process.env.TIMEOUT, 30000),
    maxRetries: parseNumber(process.env.MAX_RETRIES, 3),
    stealthMode: parseBoolean(process.env.STEALTH_MODE),
    randomizeViewport: parseBoolean(process.env.RANDOMIZE_VIEWPORT),
    randomizeUserAgent: parseBoolean(process.env.RANDOMIZE_USER_AGENT),
    simulateHumanBehavior: parseBoolean(process.env.SIMULATE_HUMAN_BEHAVIOR),
  },
  rateLimiting: {
    minDelay: parseNumber(process.env.MIN_DELAY, 2000),
    maxDelay: parseNumber(process.env.MAX_DELAY, 8000),
    rateLimitPause: parseNumber(process.env.RATE_LIMIT_PAUSE, 60000),
  },
  storage: {
    exportPath: process.env.EXPORT_PATH || './exports',
    bufferSize: parseNumber(process.env.BUFFER_SIZE, 10),
    backupEnabled: parseBoolean(process.env.BACKUP_ENABLED),
  },
  googleMaps: {
    apiKey: process.env.GOOGLE_MAPS_API_KEY || '',
    useApiFallback: parseBoolean(process.env.USE_API_FALLBACK),
  },
  proxy: {
    url: process.env.PROXY_URL || '',
    username: process.env.PROXY_USERNAME || '',
    password: process.env.PROXY_PASSWORD || '',
    rotateProxies: parseBoolean(process.env.ROTATE_PROXIES),
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || './logs',
    enableScreenshots: parseBoolean(process.env.ENABLE_SCREENSHOTS),
  },
};

const { error, value: config } = configSchema.validate(rawConfig);

if (error) {
  throw new Error(`Configuration validation error: ${error.message}`);
}

export interface Config {
  scraping: {
    headless: boolean;
    defaultWorkers: number;
    timeout: number;
    maxRetries: number;
    stealthMode: boolean;
    randomizeViewport: boolean;
    randomizeUserAgent: boolean;
    simulateHumanBehavior: boolean;
  };
  rateLimiting: {
    minDelay: number;
    maxDelay: number;
    rateLimitPause: number;
  };
  storage: {
    exportPath: string;
    bufferSize: number;
    backupEnabled: boolean;
  };
  googleMaps: {
    apiKey: string;
    useApiFallback: boolean;
  };
  proxy: {
    url: string;
    username: string;
    password: string;
    rotateProxies: boolean;
  };
  logging: {
    level: string;
    filePath: string;
    enableScreenshots: boolean;
  };
}

export default config as Config;