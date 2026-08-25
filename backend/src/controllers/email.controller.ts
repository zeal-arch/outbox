import type { Request, Response } from "express";
import { EmailSchedulerService } from "../services/email-scheduler.service.js";

const scheduler = new EmailSchedulerService();

export async function scheduleEmail(req: Request, res: Response) {
  const job = await scheduler.scheduleEmail(req.body);

  res.status(201).json({
    message: "Email scheduled",
    queueJobId: job.id
  });
}

export async function listScheduledEmails(_req: Request, res: Response) {
  res.json({ data: [] });
}

export async function listSentEmails(_req: Request, res: Response) {
  res.json({ data: [] });
}
