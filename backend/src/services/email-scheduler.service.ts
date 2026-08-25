import { emailQueue } from "../queues/email.queue.js";
import { db } from "../config/database.js";
import crypto from "crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "../config/s3.js";
import { env } from "../config/env.js";

interface ScheduleCampaignInput {
  senderId: string;
  recipientEmails: any[];
  subject: string;
  body: string;
  scheduledAt: string;
  delaySeconds: number;
  hourlyLimit?: number;
  attachments?: {
    fileName: string;
    fileType: string;
    fileSize: number;
    fileData: Buffer;
  }[];
}

export class EmailSchedulerService {
  async scheduleCampaign(input: ScheduleCampaignInput) {
    const startTimestamp = new Date(input.scheduledAt).getTime();

    // Pre-compute everything that doesn't need the DB/S3 first, so we can
    // fail fast on bad input before opening a transaction.
    const rows: {
      jobId: string;
      recipientStr: string;
      personalizedBody: string;
      scheduledTime: Date;
      idempotencyKey: string;
    }[] = [];

    for (let i = 0; i < input.recipientEmails.length; i++) {
      const recipientObj = input.recipientEmails[i];
      const recipientStr = typeof recipientObj === 'string' ? recipientObj : recipientObj.email;
      if (!recipientStr) continue;

      let personalizedBody = input.body;
      if (typeof recipientObj === 'object' && recipientObj !== null) {
        // Simple mail merge: replace {{key}} with value
        for (const [key, value] of Object.entries(recipientObj)) {
          if (key !== 'email' && typeof value === 'string') {
            const regex = new RegExp(`{{${key}}}`, 'g');
            personalizedBody = personalizedBody.replace(regex, value);
          }
        }
      }

      const scheduledTime = new Date(startTimestamp + i * input.delaySeconds * 1000);
      const jobId = crypto.randomUUID();
      const idempotencyKey = `job:${input.senderId}:${recipientStr}:${scheduledTime.getTime()}`;

      rows.push({ jobId, recipientStr, personalizedBody, scheduledTime, idempotencyKey });
    }

    // 1. Insert all rows (and attachment rows) in a single DB transaction so a
    //    unique-constraint violation on one recipient can't leave a partially
    //    created campaign behind - either the whole batch commits or none of it does.
    const client = await db.connect();
    try {
      await client.query("BEGIN");

      for (const row of rows) {
        await client.query(
          `INSERT INTO email_jobs 
           (id, sender_id, recipient_email, subject, body, scheduled_at, status, idempotency_key) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (idempotency_key) DO NOTHING`,
          [
            row.jobId,
            input.senderId,
            row.recipientStr,
            input.subject,
            row.personalizedBody,
            row.scheduledTime.toISOString(),
            "scheduled",
            row.idempotencyKey
          ]
        );

        if (input.attachments && input.attachments.length > 0) {
          for (const att of input.attachments) {
            const s3Key = `attachments/${row.jobId}/${crypto.randomUUID()}-${att.fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

            await s3Client.send(new PutObjectCommand({
              Bucket: env.s3.bucket,
              Key: s3Key,
              Body: att.fileData,
              ContentType: att.fileType
            }));

            await client.query(
              `INSERT INTO email_attachments (email_job_id, file_name, file_type, file_size, s3_key)
               VALUES ($1, $2, $3, $4, $5)`,
              [row.jobId, att.fileName, att.fileType, att.fileSize, s3Key]
            );
          }
        }
      }

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }

    // 2. Add to BullMQ Queue only after the DB transaction has committed, so we
    //    never enqueue a job whose DB row doesn't durably exist.
    const jobsCreated = [];
    for (const row of rows) {
      const delay = Math.max(row.scheduledTime.getTime() - Date.now(), 0);

      const bullJob = await emailQueue.add(
        "send-email",
        {
          emailJobId: row.jobId,
          senderId: input.senderId,
          hourlyLimit: input.hourlyLimit
        },
        {
          delay,
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 5000
          },
          removeOnComplete: false,
          removeOnFail: false
        }
      );

      await db.query(
        "UPDATE email_jobs SET bull_job_id = $1 WHERE id = $2",
        [bullJob.id, row.jobId]
      );

      jobsCreated.push({ jobId: row.jobId, recipient: row.recipientStr, scheduledAt: row.scheduledTime });
    }

    return jobsCreated;
  }
}
