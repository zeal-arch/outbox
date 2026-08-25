export type EmailStatus = "scheduled" | "sending" | "sent" | "failed";

export interface ScheduleEmailInput {
  senderId: string;
  recipientEmail: string;
  subject: string;
  body: string;
  scheduledAt: string;
}

export interface EmailJobRecord extends ScheduleEmailInput {
  id: string;
  status: EmailStatus;
  sentAt: string | null;
  bullJobId: string | null;
  attempts: number;
  lastError: string | null;
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
}
