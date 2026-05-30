import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().transform(Number).default('5001'),
  MONGO_URI: z.string().default('mongodb://localhost:27017/attendance-db'),
  JWT_SECRET: z.string().default('super-secret-jwt-key-9988'),
  JWT_REFRESH_SECRET: z.string().default('super-secret-refresh-key-1122'),
  OFFICE_START_TIME: z.string().default('09:00'), // Format: HH:MM
  ALLOWED_GPS_RADIUS_METERS: z.string().transform(Number).default('200'),
  OFFICE_LATITUDE: z.string().transform(Number).default('23.2599'),
  OFFICE_LONGITUDE: z.string().transform(Number).default('77.4126'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Environment validation failed:', parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;
export default env;
