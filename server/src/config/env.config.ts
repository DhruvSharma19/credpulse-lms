import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform((val) => parseInt(val, 10)).default('5001'),
  MONGO_URI: z.string().default('mongodb://127.0.0.1:27017/loan_management_system'),
  JWT_SECRET: z.string().min(16).default('lms_super_secret_production_ready_jwt_key_2026'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  CLIENT_ORIGIN: z.string().default('http://localhost:3000'),
  UPLOAD_DIR: z.string().default('uploads'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Invalid environment configuration:', parsedEnv.error.format());
  process.exit(1);
}

export const ENV = parsedEnv.data;
