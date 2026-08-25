export type EmailStatus = "scheduled" | "sending" | "sent" | "failed";

export interface EmailListItem {
  id: string;
  recipientEmail: string;
  subject: string;
  scheduledAt: string;
  sentAt: string | null;
  status: EmailStatus;
}
