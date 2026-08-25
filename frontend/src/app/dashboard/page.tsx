"use client";

import { useState } from "react";
import { ComposeEmailModal } from "@/components/dashboard/ComposeEmailModal";
import { ScheduledEmailsTable, ScheduledEmail } from "@/components/dashboard/ScheduledEmailsTable";
import { SentEmailsTable, SentEmail } from "@/components/dashboard/SentEmailsTable";
import { Inbox, SendHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock Data
const MOCK_SCHEDULED: ScheduledEmail[] = [
  { id: "1", email: "client1@example.com", subject: "Follow up on our meeting", scheduledTime: new Date(Date.now() + 86400000).toISOString(), status: "pending" },
  { id: "2", email: "lead@startup.io", subject: "Introduction to ReachInbox", scheduledTime: new Date(Date.now() + 3600000).toISOString(), status: "pending" },
  { id: "3", email: "ceo@techcorp.com", subject: "Enterprise Solutions", scheduledTime: new Date().toISOString(), status: "processing" },
];

const MOCK_SENT: SentEmail[] = [
  { id: "4", email: "old.client@example.com", subject: "Welcome back!", sentTime: new Date(Date.now() - 86400000).toISOString(), status: "sent" },
  { id: "5", email: "bounce@test.com", subject: "Test Campaign", sentTime: new Date(Date.now() - 186400000).toISOString(), status: "failed" },
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"scheduled" | "sent">("scheduled");
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="flex flex-col h-full w-full animate-in fade-in duration-500">
      {/* Header section with Title and Action Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-satoshi">Campaigns</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage and track your email outreach.</p>
        </div>
        <ComposeEmailModal />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-border/50 mb-6">
        <button
          onClick={() => setActiveTab("scheduled")}
          className={cn(
            "flex items-center gap-2 pb-3 text-sm font-medium transition-colors relative",
            activeTab === "scheduled" 
              ? "text-primary" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Inbox className="w-4 h-4" />
          Scheduled Emails
          {activeTab === "scheduled" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
          )}
        </button>
        
        <button
          onClick={() => setActiveTab("sent")}
          className={cn(
            "flex items-center gap-2 pb-3 text-sm font-medium transition-colors relative",
            activeTab === "sent" 
              ? "text-primary" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <SendHorizontal className="w-4 h-4" />
          Sent Emails
          {activeTab === "sent" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 w-full relative">
        {activeTab === "scheduled" ? (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <ScheduledEmailsTable emails={MOCK_SCHEDULED} isLoading={isLoading} />
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-left-4 duration-300">
            <SentEmailsTable emails={MOCK_SENT} isLoading={isLoading} />
          </div>
        )}
      </div>
    </div>
  );
}
