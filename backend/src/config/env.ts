import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  WORKER_CONCURRENCY: z.coerce.number().int().positive().default(5),
  MIN_SEND_DELAY_MS: z.coerce.number().int().nonnegative().default(2000),
  MAX_EMAILS_PER_HOUR_PER_SENDER: z.coerce.number().int().positive().default(200),
  MAX_EMAIL_RETRIES: z.coerce.number().int().nonnegative().default(3),
  EMAIL_SEND_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
  ETHEREAL_HOST: z.string().default("smtp.ethereal.email"),
  ETHEREAL_PORT: z.coerce.number().default(587),
  ETHEREAL_USER: z.string().optional(),
  ETHEREAL_PASSWORD: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().url().optional(),
  SUPABASE_S3_ENDPOINT: z.string().url(),
  SUPABASE_S3_REGION: z.string().default("ap-northeast-1"),
  SUPABASE_S3_ACCESS_KEY: z.string().min(1),
  SUPABASE_S3_SECRET_KEY: z.string().min(1),
  SUPABASE_S3_BUCKET: z.string().default("vscode"),
  LOG_LEVEL: z.string().default("info")
});

const parsed = schema.parse(process.env);

export const env = {
  nodeEnv: parsed.NODE_ENV,
  port: parsed.PORT,
  frontendUrl: parsed.FRONTEND_URL,
  databaseUrl: parsed.DATABASE_URL,
  redisUrl: parsed.REDIS_URL,
  workerConcurrency: parsed.WORKER_CONCURRENCY,
  minSendDelayMs: parsed.MIN_SEND_DELAY_MS,
  maxEmailsPerHourPerSender: parsed.MAX_EMAILS_PER_HOUR_PER_SENDER,
  maxEmailRetries: parsed.MAX_EMAIL_RETRIES,
  emailSendTimeoutMs: parsed.EMAIL_SEND_TIMEOUT_MS,
  ethereal: {
    host: parsed.ETHEREAL_HOST,
    port: parsed.ETHEREAL_PORT,
    user: parsed.ETHEREAL_USER,
    password: parsed.ETHEREAL_PASSWORD
  },
  google: {
    clientId: parsed.GOOGLE_CLIENT_ID,
    clientSecret: parsed.GOOGLE_CLIENT_SECRET,
    callbackUrl: parsed.GOOGLE_CALLBACK_URL
  },
  s3: {
    endpoint: parsed.SUPABASE_S3_ENDPOINT,
    region: parsed.SUPABASE_S3_REGION,
    accessKey: parsed.SUPABASE_S3_ACCESS_KEY,
    secretKey: parsed.SUPABASE_S3_SECRET_KEY,
    bucket: parsed.SUPABASE_S3_BUCKET
  },
  logLevel: parsed.LOG_LEVEL
};
