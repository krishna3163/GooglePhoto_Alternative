import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('4000').transform((v) => parseInt(v, 10)),
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/telegphoto'),
  JWT_SECRET: z.string().min(16).default('development_jwt_secret_must_be_long_and_safe_12345'),
  JWT_REFRESH_SECRET: z.string().min(16).default('development_jwt_refresh_secret_must_be_long_and_safe_67890'),
  ACCESS_TOKEN_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('30d'),
  FRONTEND_URL: z.string().default('https://telegphoto.vercel.app,http://localhost:5173'),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_DEFAULT_CHAT_ID: z.string().optional(),
});

export const env = envSchema.parse(process.env);
