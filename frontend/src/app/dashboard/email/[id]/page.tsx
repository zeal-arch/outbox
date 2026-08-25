"use client";

import { ArrowLeft, Star, Archive, Trash2, ChevronDown, Zap } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers";
import { apiUrl } from "@/lib/api";
import Button from "@/components/ui/Button";

export default function EmailDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { token } = useAuth();
  
  const [email, setEmail] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmail = async () => {
      if (!token || !params?.id) return;
      
      try {
        const res = await fetch(`${apiUrl}/api/emails/${params.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error("Failed to load email details");
        
        const data = await res.json();
        setEmail(data.data);
      } catch (err) {
        console.error(err);
        setError("Could not load this email.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEmail();
  }, [token, params?.id]);

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-white dark:bg-gray-dark">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !email) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-white dark:bg-gray-dark">
        <p className="text-gray-500 mb-4">{error || "Email not found"}</p>
        <Button variant="unstyled" size="none" onClick={() => router.back()} className="text-primary hover:underline">
          Go back to inbox
        </Button>
      </div>
    );
  }

  // Format date safely
  const formattedDate = new Date(email.sentTime || email.scheduledTime).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
  });

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-gray-dark">
      {/* Header */}
      <header className="sticky top-0 z-10 flex min-w-0 shrink-0 items-center justify-between border-b border-stroke bg-white px-4 py-3 dark:border-stroke-dark dark:bg-gray-dark md:px-6 font-satoshi">
        <div className="flex items-center gap-3">
          <Button 
            variant="unstyled"
            size="none"
            onClick={() => router.back()}
            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-full transition-colors dark:text-gray-400 dark:hover:bg-dark-3"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-[17px] font-medium text-dark dark:text-white truncate">
            {email.subject}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="unstyled" size="none" className="p-2 text-gray-400 hover:text-gray-600 transition-colors dark:hover:text-gray-300">
            <Star className="h-4 w-4" />
          </Button>
          <Button variant="unstyled" size="none" className="p-2 text-gray-400 hover:text-gray-600 transition-colors dark:hover:text-gray-300">
            <Archive className="h-4 w-4" />
          </Button>
          <Button variant="unstyled" size="none" className="p-2 text-gray-400 hover:text-red-500 transition-colors dark:hover:text-red-400">
            <Trash2 className="h-4 w-4" />
          </Button>
          <div className="ml-2 h-7 w-7 overflow-hidden rounded-full border border-stroke dark:border-stroke-dark">
            <img 
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
              alt="User Avatar"
              className="h-full w-full object-cover bg-gray-100 dark:bg-dark-3" 
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 lg:px-12 font-satoshi custom-scrollbar">
        {/* Sender Info */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#10C35B] text-white font-semibold shadow-sm uppercase">
              {email.email ? email.email.charAt(0) : "A"}
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-semibold text-dark dark:text-white">
                  {email.email}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  &lt;{email.email}&gt;
                </span>
              </div>
              <Button variant="unstyled" size="none" className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mt-0.5">
                to me <ChevronDown className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <span className="text-sm text-gray-400 whitespace-nowrap">
            {formattedDate}
          </span>
        </div>

        {/* Email Body */}
        <div className="text-[15px] leading-relaxed text-dark-2 dark:text-gray-300 space-y-6 max-w-4xl whitespace-pre-wrap">
          {email.body}
        </div>
      </main>
    </div>
  );
}
