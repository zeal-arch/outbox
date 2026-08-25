"use client";

import { useState, useEffect, Suspense } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Send, Mail } from "lucide-react";
import Button from "@/components/ui/Button";
import { useAuth } from "@/components/providers";
import { apiUrl } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";

export interface SentEmail {
  id: string;
  email: string;
  subject: string;
  sentTime: string;
  status: string;
}

function SentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sentEmails, setSentEmails] = useState<SentEmail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const qParam = searchParams.get("q")?.toLowerCase() || "";

  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;
    setIsLoading(true);
    fetch(`${apiUrl}/api/emails/sent`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setSentEmails(data.data || []))
      .catch(err => console.error("[Sent] Failed to fetch:", err))
      .finally(() => setIsLoading(false));
  }, [token]);

  let displayEmails = sentEmails;
  if (qParam) {
    displayEmails = displayEmails.filter(
      (e) => 
        e.subject?.toLowerCase().includes(qParam) || 
        e.email?.toLowerCase().includes(qParam)
    );
  }

  return (
    <div className="flex h-full w-full flex-col">
      <AppHeader />
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto custom-scrollbar bg-white dark:bg-gray-dark p-6">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : displayEmails.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <div className="mb-4 rounded-full bg-gray-100 p-4 dark:bg-dark-2">
              <Send className="h-8 w-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h2 className="mb-2 text-lg font-semibold text-dark dark:text-white">No sent emails</h2>
            <p className="mb-6 max-w-md text-sm text-gray-500 dark:text-gray-400">
              You haven't sent any emails yet.
            </p>
            <Button
              variant="gradient"
              onClick={() => router.push("/dashboard/compose")}
            >
              Compose Email
            </Button>
          </div>
        ) : (
          <div className="flex flex-col w-full border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-dark-2 text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-3 font-medium">To</th>
                  <th className="px-6 py-3 font-medium">Subject</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Sent Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {displayEmails.map((email) => (
                  <tr key={email.id} className="hover:bg-gray-50 dark:hover:bg-dark-2 transition-colors">
                    <td className="px-6 py-4 truncate max-w-[200px]">{email.email || "Multiple Recipients"}</td>
                    <td className="px-6 py-4 truncate max-w-[300px]">{email.subject}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#EEF5F0] text-primary dark:bg-green-950/30 text-xs font-medium">
                        {email.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(email.sentTime).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

export default function SentPage() {
  return (
    <Suspense fallback={
      <div className="flex h-full w-full items-center justify-center bg-white dark:bg-gray-dark">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    }>
      <SentContent />
    </Suspense>
  );
}
