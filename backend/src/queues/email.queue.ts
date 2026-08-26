import { Queue } from "bullmq";
import { redis } from "../config/redis.js";
import { env } from "../config/env.js";

export const EMAIL_QUEUE_NAME = env.nodeEnv === 'production' ? "email-send" : "email-send-dev";

export interface EmailQueuePayload {
  emailJobId: string;
  senderId: string;
  hourlyLimit?: number;
}

export const emailQueue = new Queue<EmailQueuePayload>(EMAIL_QUEUE_NAME, {
  connection: redis
});
