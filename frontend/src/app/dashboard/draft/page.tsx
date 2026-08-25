"use client";

import { useState, useEffect, Suspense } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { FileEdit, Mail, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import { useAuth } from "@/components/providers";
import { apiUrl } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";

export interface DraftEmail {
  id: string;
  subject: string;
  recipients: any[];
  updated_at: string;
}

function DraftsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [draftEmails, setDraftEmails] = useState<DraftEmail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const qParam = searchParams.get("q")?.toLowerCase() || "";

  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;
    setIsLoading(true);
    fetch(`${apiUrl}/api/emails/drafts`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setDraftEmails(data.data || []))
      .catch(err => console.error("[Drafts] Failed to fetch:", err))
      .finally(() => setIsLoading(false));
  }, [token]);

  let displayEmails = draftEmails;
  if (qParam) {
    displayEmails = displayEmails.filter(
      (e) => e.subject?.toLowerCase().includes(qParam)
    );
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!token) return;
    try {
      const res = await fetch(`${apiUrl}/api/emails/drafts/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setDraftEmails(prev => prev.filter(draft => draft.id !== id));
      } else {
        console.error("[Drafts] Failed to delete draft");
      }
    } catch (err) {
      console.error("[Drafts] Failed to delete draft:", err);
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
              <FileEdit className="h-8 w-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h2 className="mb-2 text-lg font-semibold text-dark dark:text-white">No drafts found</h2>
            <p className="mb-6 max-w-md text-sm text-gray-500 dark:text-gray-400">
              You don't have any saved drafts.
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
                  <th className="px-6 py-3 font-medium">Subject</th>
                  <th className="px-6 py-3 font-medium">Recipients</th>
                  <th className="px-6 py-3 font-medium">Last Updated</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {displayEmails.map((draft) => (
                  <tr 
                    key={draft.id} 
                    onClick={() => router.push(`/dashboard/compose?draftId=${draft.id}`)}
                    className="hover:bg-gray-50 dark:hover:bg-dark-2 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4 truncate max-w-[300px] font-medium text-dark dark:text-white">
                      {draft.subject || "(No Subject)"}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {draft.recipients?.length || 0} loaded
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(draft.updated_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="unstyled"
                        size="none"
                        onClick={(e) => handleDelete(e, draft.id)}
                        className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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

export default function DraftsPage() {
  return (
    <Suspense fallback={
      <div className="flex h-full w-full items-center justify-center bg-white dark:bg-gray-dark">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    }>
      <DraftsContent />
    </Suspense>
  );
}
