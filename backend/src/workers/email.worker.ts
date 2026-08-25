import { Worker, DelayedError } from "bullmq";
import { env } from "../config/env.js";
import { redis } from "../config/redis.js";
import { db } from "../config/database.js";
import { EMAIL_QUEUE_NAME, type EmailQueuePayload } from "../queues/email.queue.js";
import { EmailSenderService } from "../services/email-sender.service.js";
import { RateLimiterService } from "../services/rate-limiter.service.js";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "../config/s3.js";

const senderService = new EmailSenderService();
const rateLimiter = new RateLimiterService();

const worker = new Worker<EmailQueuePayload>(
  EMAIL_QUEUE_NAME,
  async (job, token) => {
    const { emailJobId, senderId } = job.data;
    console.log(`[Worker] Processing job ${emailJobId} for sender ${senderId}`);

    const jobResult = await db.query(
      `SELECT ej.*, s.email as sender_email, s.name as sender_name 
       FROM email_jobs ej 
       JOIN senders s ON ej.sender_id = s.id 
       WHERE ej.id = $1`,
      [emailJobId]
    );

    if (jobResult.rows.length === 0) {
      console.warn(`[Worker] Job ${emailJobId} not found in database. Skipping.`);
      return;
    }

    const jobRecord = jobResult.rows[0];

    // Ensure idempotency: Skip if already processed
    if (jobRecord.status === "sent") {
      console.log(`[Worker] Job ${emailJobId} already sent. Skipping.`);
      return;
    }

    // 2. Check Hourly Rate Limit
    const limitCheck = await rateLimiter.checkRateLimit(senderId);
    if (!limitCheck.allowed) {
      const delayMs = limitCheck.retryAfterMs || 60000;
      console.log(`[Worker] Rate limit exceeded for sender ${senderId}. Delaying job ${emailJobId} by ${delayMs}ms.`);
      
      // Move job back to delayed queue manually
      await job.moveToDelayed(Date.now() + delayMs, token);
      throw new DelayedError(); // Prevents BullMQ from marking the job as failed or completed
    }

    // 3. Mark job as sending in Postgres
    await db.query(
      "UPDATE email_jobs SET status = 'sending', attempts = attempts + 1, updated_at = NOW() WHERE id = $1",
      [emailJobId]
    );

    // 4. Enforce provider throttling delay
    if (env.minSendDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, env.minSendDelayMs));
    }

    // 4.5 Fetch attachments from S3
    const attachmentsResult = await db.query(
      "SELECT file_name, file_type, s3_key FROM email_attachments WHERE email_job_id = $1",
      [emailJobId]
    );

    const attachments = [];
    for (const att of attachmentsResult.rows) {
      if (att.s3_key) {
        try {
          const s3Response = await s3Client.send(new GetObjectCommand({
            Bucket: env.s3.bucket,
            Key: att.s3_key
          }));
          
          if (s3Response.Body) {
            const arrayBuffer = await s3Response.Body.transformToByteArray();
            attachments.push({
              filename: att.file_name,
              contentType: att.file_type,
              content: Buffer.from(arrayBuffer)
            });
          }
        } catch (e) {
          console.error(`[Worker] Failed to download attachment ${att.s3_key} from S3`, e);
        }
      }
    }

    // 5. Send email via Ethereal SMTP
    try {
      const fromFormatted = `"${jobRecord.sender_name}" <${jobRecord.sender_email}>`;
      const info = await senderService.sendEmail(
        fromFormatted,
        jobRecord.recipient_email,
        jobRecord.subject,
        jobRecord.body,
        attachments.length > 0 ? attachments : undefined
      );
      
      console.log(`[Worker] Email sent successfully for job ${emailJobId}. MessageId: ${info.messageId}`);

      // 6. Update Postgres to sent
      await db.query(
        "UPDATE email_jobs SET status = 'sent', sent_at = NOW(), updated_at = NOW() WHERE id = $1",
        [emailJobId]
      );
    } catch (sendErr: any) {
      console.error(`[Worker] Failed to send email for job ${emailJobId}:`, sendErr);

      // Save error details to PostgreSQL
      await db.query(
        "UPDATE email_jobs SET last_error = $1, updated_at = NOW() WHERE id = $2",
        [sendErr.message || String(sendErr), emailJobId]
      );

      // Re-throw so BullMQ triggers retry mechanism
      throw sendErr;
    }
  },
  {
    connection: redis,
    concurrency: env.workerConcurrency
  }
);

worker.on("completed", (job) => {
  console.log(`[Worker] Job completed: ${job.id}`);
});

worker.on("failed", async (job, error) => {
  console.error(`[Worker] Job failed: ${job?.id}. Error: ${error.message}`);
  
  if (job) {
    const { emailJobId } = job.data;
    
    // Check if we exhausted all attempts
    const maxAttempts = job.opts.attempts || 1;
    const currentAttempts = job.attemptsMade;

    if (currentAttempts >= maxAttempts) {
      console.log(`[Worker] Job ${emailJobId} failed permanently after ${currentAttempts} attempts.`);
      await db.query(
        "UPDATE email_jobs SET status = 'failed', updated_at = NOW() WHERE id = $1",
        [emailJobId]
      );
    } else {
      // Revert status to scheduled so it is displayed correctly while retrying
      await db.query(
        "UPDATE email_jobs SET status = 'scheduled', updated_at = NOW() WHERE id = $1",
        [emailJobId]
      );
    }
  }
});
