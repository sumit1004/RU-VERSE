import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from backend root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET || 'fallback-secret-for-dev-only-change-in-prod',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  COOKIE_NAME: process.env.COOKIE_NAME || 'ruverse_auth',
  ADMIN_NAME: process.env.ADMIN_NAME || 'RUVERSE Admin',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@ruverse.in',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'AdminSecurePassword2026!',
};
