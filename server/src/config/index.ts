import dotenv from 'dotenv';

dotenv.config();

let _envValidated = false;

function validateRequiredEnv() {
  if (_envValidated) return;
  const missing: string[] = [];
  if (!process.env.MONGODB_URI) missing.push('MONGODB_URI');
  if (!process.env.JWT_SECRET) missing.push('JWT_SECRET');
  if (missing.length > 0) {
    throw new Error(`Missing required environment variable${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}`);
  }
  _envValidated = true;
}

export function getMongoUri(): string {
  validateRequiredEnv();
  return process.env.MONGODB_URI!;
}

export function getJwtSecret(): string {
  validateRequiredEnv();
  return process.env.JWT_SECRET!;
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  get mongodbUri() { return getMongoUri(); },
  jwt: {
    get secret() { return getJwtSecret(); },
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX) || 300,
    authMax: Number(process.env.AUTH_RATE_LIMIT_MAX) || 20,
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
  bank: {
    bin: process.env.BANK_BIN || '',
    accountNumber: process.env.BANK_ACCOUNT_NUMBER || '',
    accountName: process.env.BANK_ACCOUNT_NAME || '',
    accountDisplayName: process.env.BANK_ACCOUNT_DISPLAY_NAME || process.env.BANK_ACCOUNT_NAME || '',
  },
  qrTtlMinutes: Number(process.env.QR_TTL_MINUTES) || 5,
  paymentWebhookSecret: process.env.PAYMENT_WEBHOOK_SECRET || '',
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
  },
  supportEmail: process.env.SUPPORT_EMAIL || 'support@store3d.com',
  ai: {
    provider: process.env.AI_PROVIDER || 'mock',
    model: process.env.AI_MODEL || 'gpt-3.5-turbo',
    apiKey: process.env.AI_API_KEY || '',
  },
} as const;
