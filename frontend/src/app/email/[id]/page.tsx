"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Star, Archive, Trash2, File, Download } from "lucide-react";
import { useAuth } from "@/components/providers";
import { apiUrl } from "@/lib/api";

interface Attachment {
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
}

interface EmailDetail {
  id: string;
  email: string;
  subject: string;
  body: string;
  sentTime?: string;
  scheduledTime?: string;
  status: string;
  created_at: string;
  is_starred?: boolean;
  attachments?: Attachment[];
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function EmailDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const [email, setEmail] = useState<EmailDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const id = params.id as string;

  useEffect(() => {
    if (!token || !id) return;
    
    setIsLoading(true);
    fetch(`${apiUrl}/api/emails/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.data) setEmail(data.data);
      })
      .catch(err => console.error("Failed to fetch email:", err))
      .finally(() => setIsLoading(false));
  }, [id, token]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white dark:bg-gray-dark">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!email) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white dark:bg-gray-dark">
        <div className="text-gray-500">Email not found</div>
      </div>
    );
  }

  const isImage = (type: string) => type.startsWith('image/');
  const displayTime = email.sentTime || email.scheduledTime || email.created_at;

  const toggleStar = async () => {
    if (!token || !email) return;

    const newStarred = !email.is_starred;
    setEmail({ ...email, is_starred: newStarred });

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
      setEmail({ ...email, is_starred: !newStarred });
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-white dark:bg-gray-dark font-satoshi">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()} 
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-2 text-gray-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-medium text-dark dark:text-white truncate max-w-3xl">
            {email.subject}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleStar}
            className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-2 transition-colors ${email.is_starred ? 'text-amber-400 hover:text-amber-500' : 'text-gray-400 hover:text-gray-500'}`}
          >
            <Star className="w-5 h-5" fill={email.is_starred ? "currentColor" : "none"} />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-2 text-gray-400 transition-colors">
            <Archive className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-2 text-gray-400 transition-colors">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Email Content */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-4xl mx-auto">
          {/* Header Info */}
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold shadow-sm">
                {email.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-dark dark:text-white">To:</span>
                  <span className="text-gray-900 dark:text-gray-200 font-medium">{email.email}</span>
                </div>
                <div className="text-sm text-gray-500 mt-0.5">
                  Status: <span className="capitalize text-primary font-medium">{email.status}</span>
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {new Date(displayTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
            </div>
          </div>

          {/* Body */}
          <div 
            className="text-gray-800 dark:text-gray-200 leading-relaxed text-[15px] prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: email.body }}
          />

          {/* Attachments */}
          {email.attachments && email.attachments.length > 0 && (
            <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                {email.attachments.length} Attachment{email.attachments.length > 1 ? 's' : ''}
              </h3>
              <div className="flex flex-wrap gap-4">
                {email.attachments.map((att, i) => (
                  <div key={i} className="flex flex-col group relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-2 w-64 hover:border-primary/50 transition-colors">
                    {isImage(att.fileType) ? (
                      <div className="h-36 w-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                        {/* Use object-cover to show the image preview properly */}
                        <img src={att.url} alt={att.fileName} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="h-36 w-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-400">
                        <File className="w-12 h-12" />
                      </div>
                    )}
                    
                    <div className="p-3 bg-white dark:bg-gray-dark border-t border-gray-200 dark:border-gray-700">
                      <div className="text-sm font-medium text-dark dark:text-white truncate">
                        {att.fileName}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatBytes(att.fileSize)}
                      </div>
                    </div>
                    
                    {/* Hover Overlay for Download */}
                    <a 
                      href={att.url}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <div className="bg-white/90 text-dark rounded-full p-3 shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all">
                        <Download className="w-5 h-5" />
                      </div>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
