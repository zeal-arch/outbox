"use client";

import { useState, useEffect, Suspense } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Send, Mail, Clock } from "lucide-react";
import Button from "@/components/ui/Button";
import { useAuth } from "@/components/providers";
import { apiUrl } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export interface SentEmail {
  id: string;
  email: string;
  subject: string;
  sentTime: string;
  status: string;
  is_starred?: boolean;
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

  const toggleStar = async (e: React.MouseEvent, email: SentEmail) => {
    e.preventDefault(); // prevent navigation
    if (!token) return;

    const newStarred = !email.is_starred;
    setSentEmails(prev => prev.map(m => m.id === email.id ? { ...m, is_starred: newStarred } : m));

    try {
      await fetch(`${apiUrl}/api/emails/${email.id}/star`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ is_starred: newStarred })
      });
    } catch (err) {
      console.error("Failed to star:", err);
      // Revert on error
      setSentEmails(prev => prev.map(m => m.id === email.id ? { ...m, is_starred: !newStarred } : m));
    }
  };

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
          <div className="flex flex-col w-full">
            {displayEmails.map((email) => (
              <Link 
                href={`/dashboard/email/${email.id}`}
                key={email.id} 
                className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-dark-2/50 transition-colors px-2 cursor-pointer"
              >
                <div className="flex items-center gap-4 flex-1 overflow-hidden">
                  <div className="w-[200px] shrink-0 font-semibold text-dark dark:text-white truncate text-sm">
                    To: {email.email || "Multiple Recipients"}
                  </div>
                  <div className="shrink-0 flex items-center gap-3">
                    <div className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 text-xs font-semibold capitalize">
                      {email.status}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(email.sentTime).toLocaleTimeString([], { hour: 'numeric', minute:'2-digit' })}
                    </div>
                  </div>
                  <div className="flex-1 truncate ml-2 text-sm">
                    <span className="font-semibold text-dark dark:text-white">{email.subject}</span>
                    <span className="text-gray-400 dark:text-gray-500 ml-2">- ...</span>
                  </div>
                </div>
                <div className="shrink-0 ml-4 flex items-center">
                  <Button 
                    variant="unstyled" 
                    size="none" 
                    onClick={(e) => toggleStar(e, email)}
                    className={`p-2 transition-colors ${email.is_starred ? 'text-amber-400 hover:text-amber-500' : 'text-gray-300 hover:text-gray-500'}`}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={email.is_starred ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                  </Button>
                </div>
              </Link>
            ))}
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
