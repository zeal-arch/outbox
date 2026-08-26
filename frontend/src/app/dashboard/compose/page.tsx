"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ComposeHeader } from "./components/ComposeHeader";
import { ComposeEditor } from "./components/ComposeEditor";
import { ComposeRecipients } from "./components/ComposeRecipients";
import { ComposeAttachments } from "./components/ComposeAttachments";
import { AttachmentFile } from "./components/ComposeTypes";
import { toast } from "sonner";
import { apiUrl } from "@/lib/api";
import { useAuth } from "@/components/providers";

function ComposeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuth();
  
  const draftIdParam = searchParams.get("draftId");
  
  const [draftId, setDraftId] = useState(draftIdParam || "");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [delay, setDelay] = useState("2");
  const [hourlyLimit, setHourlyLimit] = useState("200");
  const [scheduledIso, setScheduledIso] = useState("");
  const [scheduledLabel, setScheduledLabel] = useState("");
  const [parsedEmails, setParsedEmails] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [showInlineDropzone, setShowInlineDropzone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasLoadedDraft, setHasLoadedDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const fetchDraft = useCallback(async () => {
    if (!token || !draftIdParam) return;
    try {
      const res = await fetch(`${apiUrl}/api/emails/drafts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const draft = data.data?.find((d: any) => d.id === draftIdParam);
        if (draft) {
          setDraftId(draft.id);
          setSubject(draft.subject || "");
          setBody(draft.body || "");
          setParsedEmails(typeof draft.recipients === 'string' ? JSON.parse(draft.recipients) : (draft.recipients || []));
          if (draft.settings) {
            const settings = typeof draft.settings === 'string' ? JSON.parse(draft.settings) : draft.settings;
            if (settings.delay) setDelay(settings.delay.toString());
            if (settings.hourlyLimit) setHourlyLimit(settings.hourlyLimit.toString());
          }
        }
      }
    } catch (err) {
      console.error("Failed to load draft:", err);
    }
  }, [token, draftIdParam]);

  useEffect(() => {
    if (!hasLoadedDraft) {
      fetchDraft();
      setHasLoadedDraft(true);
    }
  }, [hasLoadedDraft, fetchDraft]);

  useEffect(() => {
    if (!hasLoadedDraft || !token) return;
    
    // Do not create a brand new draft if the user hasn't typed anything yet
    if (!draftId && !subject.trim() && !body.trim() && parsedEmails.length === 0) {
      return;
    }
    
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`${apiUrl}/api/emails/drafts`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            id: draftId || undefined,
            subject,
            body,
            recipients: parsedEmails,
            settings: { delay, hourlyLimit }
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.data?.id) setDraftId(data.data.id);
          setLastSaved(new Date());
        }
      } catch (err) {
        console.error("Failed to save draft:", err);
      }
    }, 2000);
    return () => clearTimeout(timeout);
  }, [subject, body, parsedEmails, delay, hourlyLimit, hasLoadedDraft, token, draftId]);
  
  const processNewFiles = (files: FileList | File[]) => {
    const newAttachments: AttachmentFile[] = Array.from(files).map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      previewUrl: URL.createObjectURL(file),
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + " MB",
    }));
    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };
  
  const handleClose = () => {
    router.push("/dashboard");
  };
  
  const handleSubmit = async () => {
    if (!subject || !body || parsedEmails.length === 0) {
      toast.error("Please fill in subject, body, and recipients.");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append("subject", subject);
      formData.append("body", body);
      formData.append("delaySeconds", delay);
      formData.append("hourlyLimit", hourlyLimit);
      if (scheduledIso) {
        formData.append("scheduledAt", scheduledIso);
      }
      formData.append("recipientEmails", JSON.stringify(parsedEmails));
      
      if (draftId) {
        formData.append("draftId", draftId);
      }
      
      attachments.forEach((att) => {
        if (att.file) {
          formData.append("attachments", att.file);
        }
      });
      
      const res = await fetch(`${apiUrl}/api/emails/schedule`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      
      if (!res.ok) {
        throw new Error("Failed to schedule email");
      }
      
      toast.success("Campaign scheduled successfully!");
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      toast.error("Error scheduling campaign");
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableVariables = parsedEmails.length > 0 && typeof parsedEmails[0] === 'object' 
    ? Object.keys(parsedEmails[0]).filter(k => k !== 'email') 
    : [];

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-white dark:bg-gray-dark">
      <ComposeHeader 
        onClose={handleClose}
        onAttachmentClick={() => setShowInlineDropzone(true)}
        attachments={attachments}
        scheduledIso={scheduledIso}
        scheduledLabel={scheduledLabel}
        setScheduledIso={setScheduledIso}
        setScheduledLabel={setScheduledLabel}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        lastSaved={lastSaved}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col p-6 overflow-y-auto custom-scrollbar max-w-5xl mx-auto w-full">
          <ComposeRecipients 
            parsedEmails={parsedEmails}
            setParsedEmails={setParsedEmails}
          />
          
          <div className="mt-6 mb-2 flex-1 flex flex-col">
            <ComposeEditor 
              subject={subject}
              setSubject={setSubject}
              body={body}
              setBody={setBody}
              delay={delay}
              setDelay={setDelay}
              hourlyLimit={hourlyLimit}
              setHourlyLimit={setHourlyLimit}
              onImageUploadClick={() => setShowInlineDropzone(true)}
              availableVariables={availableVariables}
              recipientCount={parsedEmails.length}
              attachmentNode={
                (attachments.length > 0 || showInlineDropzone) ? (
                  <ComposeAttachments 
                    attachments={attachments}
                    removeAttachment={removeAttachment}
                    showInlineDropzone={showInlineDropzone}
                    setShowInlineDropzone={setShowInlineDropzone}
                    processNewFiles={processNewFiles}
                  />
                ) : undefined
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ComposePage() {
  return (
    <Suspense fallback={
      <div className="flex h-full w-full items-center justify-center bg-white dark:bg-gray-dark">
        <div className="w-8 h-8 rounded-full border-2 border-[#10C35B] border-t-transparent animate-spin" />
      </div>
    }>
      <ComposeContent />
    </Suspense>
  );
}
