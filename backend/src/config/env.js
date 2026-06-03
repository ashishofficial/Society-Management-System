import dotenv from 'dotenv';

dotenv.config();

const required = ['MONGODB_URI', 'JWT_SECRET'];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

// A weak or placeholder JWT secret lets anyone forge tokens for any user/tenant. Refuse to start
// with a known-bad secret outside development.
const WEAK_SECRET = /^(change-me|secret|changeme|password|test|default)/i;
if (process.env.NODE_ENV === 'production') {
  if (process.env.JWT_SECRET.length < 32 || WEAK_SECRET.test(process.env.JWT_SECRET)) {
    throw new Error('JWT_SECRET must be a strong, non-default value (>=32 chars) in production');
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  maintenanceDueDay: Number(process.env.MAINTENANCE_DUE_DAY || 10),
  lateFeePerDay: Number(process.env.LATE_FEE_PER_DAY || 50),
  paymentGatewayBaseUrl: process.env.PAYMENT_GATEWAY_BASE_URL || 'https://payments.clave.local/pay',
};
