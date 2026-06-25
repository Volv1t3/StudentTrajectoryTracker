import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  DB_HOST: z.string().min(1),
  DB_PORT: z.string().min(1),
  DB_NAME: z.string().min(1),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  JWT_ADMIN_ACCESS_EXPIRES_IN: z.string().default('8h'),
  JWT_ADMIN_REFRESH_EXPIRES_IN: z.string().default('1d'),
  BCRYPT_ROUNDS: z.coerce.number().default(12),
  ACTIVATION_TOKEN_SECRET: z.string().min(1),
  RESET_TOKEN_SECRET: z.string().min(1),
  ACTIVATION_TOKEN_TTL_H: z.coerce.number().default(24),
  RESET_TOKEN_TTL_M: z.coerce.number().default(60),
  PORT: z.coerce.number().default(34761),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  SITE_URL: z.string().url().min(1),
  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().min(1),
  EMAIL_FROM_NAME: z.string().min(1),
  SUPABASE_URL: z.string().url(),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  STORAGE_PROVIDER: z.string().min(1),
  SUPABASE_BUCKET_PROJECTS: z.string().min(1),
  SUPABASE_BUCKET_EVENTS: z.string().min(1),
  UPLOAD_MAX_SIZE_MB: z.coerce.number().default(5),
  UPLOAD_ALLOWED_TYPES: z.string().default('image/jpeg,image/png,image/webp'),
  // Backend-owned PostHog analytics (NOT the public/frontend keys).
  // Optional so the backend still boots when analytics are not configured locally;
  // the analytics service no-ops when these are absent.
  POSTHOG_KEY: z.string().optional().default(''),
  POSTHOG_HOST: z.string().optional().default(''),
});

export const env = envSchema.parse(process.env);
