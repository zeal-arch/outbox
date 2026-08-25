"use client";

import { CheckCircle2, AlertCircle, Send } from "lucide-react";
import { format } from "date-fns";

export interface SentEmail {
  id: string;
  email: string;
  subject: string;
  sentTime: string;
  status: "sent" | "failed";
}

interface SentEmailsTableProps {
  emails: SentEmail[];
  isLoading: boolean;
}

export function SentEmailsTable({ emails, isLoading }: SentEmailsTableProps) {
  if (isLoading) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center border border-border/50 rounded-xl bg-card">
        <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin mb-4" />
        <p className="text-sm text-muted-foreground">Loading sent emails...</p>
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center border border-border/50 border-dashed rounded-xl bg-card/50">
        <Send className="w-10 h-10 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium text-foreground">No Sent Emails</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm text-center">
          Once your scheduled emails are dispatched, they will appear here.
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
              <th scope="col" className="px-6 py-4 font-medium">Sent Time</th>
              <th scope="col" className="px-6 py-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {emails.map((email) => (
              <tr key={email.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4 font-medium text-foreground">{email.email}</td>
                <td className="px-6 py-4 text-muted-foreground truncate max-w-xs">{email.subject}</td>
                <td className="px-6 py-4 text-muted-foreground">
                  {format(new Date(email.sentTime), "MMM d, yyyy h:mm a")}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {email.status === "sent" && (
                      <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-md text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Sent
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
