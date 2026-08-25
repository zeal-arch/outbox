import { Worker } from "bullmq";
import { env } from "../config/env.js";
import { redis } from "../config/redis.js";
import { EMAIL_QUEUE_NAME, type EmailQueuePayload } from "../queues/email.queue.js";

const worker = new Worker<EmailQueuePayload>(
  EMAIL_QUEUE_NAME,
  async (job) => {
    console.log("Processing email job", job.data.emailJobId);
  },
  {
    connection: redis,
    concurrency: env.workerConcurrency
  }
);

worker.on("completed", (job) => {
  console.log("Email job completed", job.id);
});

worker.on("failed", (job, error) => {
  console.error("Email job failed", job?.id, error);
});
