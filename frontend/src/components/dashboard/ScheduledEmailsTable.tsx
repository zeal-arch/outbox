"use client";

import { Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { format } from "date-fns";

export interface ScheduledEmail {
  id: string;
  email: string;
  subject: string;
  scheduledTime: string;
  status: "pending" | "processing" | "failed";
}

interface ScheduledEmailsTableProps {
  emails: ScheduledEmail[];
  isLoading: boolean;
}

export function ScheduledEmailsTable({ emails, isLoading }: ScheduledEmailsTableProps) {
  if (isLoading) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center border border-border/50 rounded-xl bg-card">
        <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin mb-4" />
        <p className="text-sm text-muted-foreground">Loading scheduled emails...</p>
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center border border-border/50 border-dashed rounded-xl bg-card/50">
        <Clock className="w-10 h-10 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium text-foreground">No Scheduled Emails</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm text-center">
          You haven't scheduled any emails yet. Click "Compose New Email" to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden border border-border/50 rounded-xl bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border/50">
            <tr>
              <th scope="col" className="px-6 py-4 font-medium">Recipient Email</th>
              <th scope="col" className="px-6 py-4 font-medium">Subject</th>
              <th scope="col" className="px-6 py-4 font-medium">Scheduled Time</th>
              <th scope="col" className="px-6 py-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {emails.map((email) => (
              <tr key={email.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4 font-medium text-foreground">{email.email}</td>
                <td className="px-6 py-4 text-muted-foreground truncate max-w-xs">{email.subject}</td>
                <td className="px-6 py-4 text-muted-foreground">
                  {format(new Date(email.scheduledTime), "MMM d, yyyy h:mm a")}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {email.status === "pending" && (
                      <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-md text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        <Clock className="w-3.5 h-3.5" />
                        Pending
                      </span>
                    )}
                    {email.status === "processing" && (
                      <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-md text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        <div className="w-3 h-3 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
                        Processing
                      </span>
                    )}
                    {email.status === "failed" && (
                      <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-md text-xs font-medium bg-red-500/10 text-red-600 dark:text-red-400">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Failed
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
