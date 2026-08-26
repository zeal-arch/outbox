import type { Request, Response } from "express";
import { EmailSchedulerService } from "../services/email-scheduler.service.js";
import { db } from "../config/database.js";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "../config/s3.js";
import { env } from "../config/env.js";

const scheduler = new EmailSchedulerService();

export async function scheduleEmail(req: Request, res: Response) {
  let { subject, body, scheduledAt, delaySeconds, hourlyLimit, recipientEmails } = req.body;
  const user = (req as any).user;

  // Since we use FormData, recipientEmails might be a JSON string
  if (typeof recipientEmails === 'string') {
    try {
      recipientEmails = JSON.parse(recipientEmails);
    } catch (e) {
      // Ignore
    }
  }

  if (!recipientEmails || !Array.isArray(recipientEmails) || recipientEmails.length === 0) {
    res.status(400).json({ error: "recipientEmails array is required" });
    return;
  }

  if (!subject || !body) {
    res.status(400).json({ error: "subject and body are required" });
    return;
  }

  try {
    const files = req.files as Express.Multer.File[] || [];

    const jobs = await scheduler.scheduleCampaign({
      senderId: user.id,
      recipientEmails,
      subject,
      body,
      scheduledAt: scheduledAt || new Date().toISOString(),
      delaySeconds: Number(delaySeconds) || 2,
      hourlyLimit: hourlyLimit ? Number(hourlyLimit) : undefined,
      attachments: files.map(f => ({
        fileName: f.originalname,
        fileType: f.mimetype,
        fileSize: f.size,
        fileData: f.buffer
      }))
    });

    if (req.body.draftId) {
      await db.query("DELETE FROM email_drafts WHERE id = $1 AND sender_id = $2", [req.body.draftId, user.id]);
    }


    res.status(201).json({
      message: "Emails scheduled successfully",
      jobsCount: jobs.length
    });
  } catch (err) {
    console.error("[EmailController] Failed to schedule campaign:", err);
    res.status(500).json({ error: "Failed to schedule emails" });
  }
}

export async function listScheduledEmails(req: Request, res: Response) {
  const user = (req as any).user;
  try {
    const result = await db.query(
      "SELECT id, recipient_email as email, subject, scheduled_at as \"scheduledTime\", status FROM email_jobs WHERE sender_id = $1 AND status = 'scheduled' ORDER BY scheduled_at ASC",
      [user.id]
    );
    res.json({ data: result.rows });
  } catch (err) {
    console.error("[EmailController] Failed to list scheduled emails:", err);
    res.status(500).json({ error: "Failed to load scheduled emails" });
  }
}

export async function listSentEmails(req: Request, res: Response) {
  const user = (req as any).user;
  try {
    const result = await db.query(
      "SELECT id, recipient_email as email, subject, body, sent_at as \"sentTime\", status FROM email_jobs WHERE sender_id = $1 AND status IN ('sent', 'failed') ORDER BY sent_at DESC, updated_at DESC",
      [user.id]
    );
    res.json({ data: result.rows });
  } catch (err) {
    console.error("[EmailController] Failed to list sent emails:", err);
    res.status(500).json({ error: "Failed to load sent emails" });
  }
}

export async function getEmailById(req: Request, res: Response) {
  const user = (req as any).user;
  const { id } = req.params;
  try {
    const result = await db.query(
      "SELECT id, recipient_email as email, subject, body, sent_at as \"sentTime\", scheduled_at as \"scheduledTime\", status, created_at FROM email_jobs WHERE id = $1 AND sender_id = $2",
      [id, user.id]
    );
    
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Email not found" });
      return;
    }
    
    const emailData = result.rows[0];

    const attachmentResult = await db.query(
      "SELECT file_name, file_type, file_size, s3_key FROM email_attachments WHERE email_job_id = $1",
      [id]
    );

    const attachments = [];
    for (const att of attachmentResult.rows) {
      let url = "";
      if (att.s3_key) {
        const command = new GetObjectCommand({
          Bucket: env.s3.bucket,
          Key: att.s3_key,
        });
        url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      }

      attachments.push({
        fileName: att.file_name,
        fileType: att.file_type,
        fileSize: att.file_size,
        url
      });
    }

    emailData.attachments = attachments;

    res.json({ data: emailData });
  } catch (err) {
    console.error("[EmailController] Failed to get email by id:", err);
    res.status(500).json({ error: "Failed to get email" });
  }
}

export async function listDrafts(req: Request, res: Response) {
  const user = (req as any).user;
  try {
    const result = await db.query(
      "SELECT id, subject, body, recipients, settings, updated_at FROM email_drafts WHERE sender_id = $1 ORDER BY updated_at DESC",
      [user.id]
    );
    res.json({ data: result.rows });
  } catch (err) {
    console.error("[EmailController] Failed to list drafts:", err);
    res.status(500).json({ error: "Failed to load drafts" });
  }
}

export async function saveDraft(req: Request, res: Response) {
  const user = (req as any).user;
  const { id, subject, body, recipients, settings } = req.body;
  
  try {
    if (id) {
      // Update existing
      const result = await db.query(
        "UPDATE email_drafts SET subject = $1, body = $2, recipients = $3, settings = $4, updated_at = NOW() WHERE id = $5 AND sender_id = $6 RETURNING id",
        [subject, body, JSON.stringify(recipients || []), JSON.stringify(settings || {}), id, user.id]
      );
      if (result.rows.length > 0) {
        res.json({ data: result.rows[0] });
        return;
      }
    }
    
    // Create new
    const result = await db.query(
      "INSERT INTO email_drafts (sender_id, subject, body, recipients, settings) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      [user.id, subject, body, JSON.stringify(recipients || []), JSON.stringify(settings || {})]
    );
    res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    console.error("[EmailController] Failed to save draft:", err);
    res.status(500).json({ error: "Failed to save draft" });
  }
}

export async function deleteDraft(req: Request, res: Response) {
  const user = (req as any).user;
  const { id } = req.params;
  
  try {
    const result = await db.query(
      "DELETE FROM email_drafts WHERE id = $1 AND sender_id = $2 RETURNING id",
      [id, user.id]
    );
    
    if (result.rowCount === 0) {
      res.status(404).json({ error: "Draft not found or unauthorized" });
      return;
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error("[EmailController] Failed to delete draft:", err);
    res.status(500).json({ error: "Failed to delete draft" });
  }
}
