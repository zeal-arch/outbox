import { Queue } from "bullmq";
import { redis } from "../config/redis.js";

export const EMAIL_QUEUE_NAME = "email-send";

export interface EmailQueuePayload {
  emailJobId: string;
  senderId: string;
  hourlyLimit?: number;
}

export const emailQueue = new Queue<EmailQueuePayload>(EMAIL_QUEUE_NAME, {
  connection: redis
});
