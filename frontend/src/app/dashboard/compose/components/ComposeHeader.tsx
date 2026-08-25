"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Paperclip, Clock } from "lucide-react";
import { AttachmentFile } from "./ComposeTypes";
import Button from "@/components/ui/Button";

interface ComposeHeaderProps {
  onClose: () => void;
  onAttachmentClick: () => void;
  attachments: AttachmentFile[];
  
  scheduledIso: string;
  scheduledLabel: string;
  setScheduledIso: (iso: string) => void;
  setScheduledLabel: (label: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  lastSaved?: Date | null;
}

export function ComposeHeader({
  onClose,
  onAttachmentClick,
  attachments,
  scheduledIso,
  scheduledLabel,
  setScheduledIso,
  setScheduledLabel,
  onSubmit,
  isSubmitting,
  lastSaved
}: ComposeHeaderProps) {
  const [showSendLater, setShowSendLater] = useState(false);
  const [customDateTime, setCustomDateTime] = useState("");
  const sendLaterDropdownRef = useRef<HTMLDivElement>(null);

  // Close "Send Later" dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        sendLaterDropdownRef.current && 
        !sendLaterDropdownRef.current.contains(event.target as Node)
      ) {
        setShowSendLater(false);
      }
    }

    if (showSendLater) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSendLater]);

  const applyPreset = (preset: "tomorrow-default" | "tomorrow-10" | "tomorrow-11" | "tomorrow-15") => {
    const d = new Date();
    d.setDate(d.getDate() + 1);

    let label = "Tomorrow";
    if (preset === "tomorrow-default") {
      d.setHours(9, 0, 0, 0);
      label = "Tomorrow, 9:00 AM";
    } else if (preset === "tomorrow-10") {
      d.setHours(10, 0, 0, 0);
      label = "Tomorrow, 10:00 AM";
    } else if (preset === "tomorrow-11") {
      d.setHours(11, 0, 0, 0);
      label = "Tomorrow, 11:00 AM";
    } else if (preset === "tomorrow-15") {
      d.setHours(15, 0, 0, 0);
      label = "Tomorrow, 3:00 PM";
    }

    setScheduledIso(d.toISOString());
    setScheduledLabel(label);
    setShowSendLater(false);
  };

  const applyCustomDateTime = () => {
    if (!customDateTime) return;
    const d = new Date(customDateTime);
    if (!isNaN(d.getTime())) {
      setScheduledIso(d.toISOString());
      setScheduledLabel(d.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }));
    }
    setShowSendLater(false);
  };

  const clearSchedule = () => {
    setScheduledIso("");
    setScheduledLabel("");
    setCustomDateTime("");
    setShowSendLater(false);
  };

  return (
    <>
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-dark-2 shrink-0 z-10">
        <div className="flex items-center gap-4">
          <Button 
            variant="unstyled" size="none"
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-500 dark:text-gray-400"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-[20px] font-semibold text-gray-800 dark:text-gray-100">
            Compose New Email
          </h2>
        </div>
        
        <div className="flex items-center gap-4">
          {lastSaved && (
            <span className="text-xs font-medium text-gray-400 dark:text-gray-500 mr-2">
              Draft saved at {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          
          <Button
            variant="unstyled" size="none"
            onClick={onAttachmentClick}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-400 relative flex items-center justify-center"
          >
            <Paperclip className="w-5 h-5" />
            {attachments.length > 0 && (
              <span className="absolute bottom-1 right-0 translate-x-1 translate-y-1 rounded-full bg-[#10C35B] px-1 py-px text-[10px] font-bold text-white leading-none">
                {attachments.length}
              </span>
            )}
          </Button>
          
          <div className="relative" ref={sendLaterDropdownRef}>
            <Button 
              variant="unstyled" size="none"
              onClick={() => setShowSendLater(!showSendLater)}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-400 flex items-center justify-center"
            >
              <Clock className="w-5 h-5" />
            </Button>
            
            {showSendLater && (
              <div className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-dark-3 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 dark:border-gray-800 z-50 p-2 text-gray-700 dark:text-gray-200">
                <div className="p-3 border-b border-gray-100 dark:border-gray-800">
                  <h3 className="font-semibold text-[15px] mb-3">Send Later</h3>
                  <div className="relative">
                    <input 
                      type="datetime-local" 
                      value={customDateTime}
                      onChange={(e) => setCustomDateTime(e.target.value)}
                      className="w-full text-sm py-2 pl-3 pr-8 rounded-lg bg-gray-50 dark:bg-dark-2 border border-gray-200 dark:border-gray-700 outline-none focus:border-[#10C35B] dark:text-gray-200"
                      placeholder="Pick date & time"
                    />
                  </div>
                </div>
                
                <div className="p-2 space-y-1">
                  <Button variant="unstyled" size="none" onClick={() => applyPreset("tomorrow-default")} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-dark-2 rounded-lg">Tomorrow</Button>
                  <Button variant="unstyled" size="none" onClick={() => applyPreset("tomorrow-10")} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-dark-2 rounded-lg">Tomorrow, 10:00 AM</Button>
                  <Button variant="unstyled" size="none" onClick={() => applyPreset("tomorrow-11")} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-dark-2 rounded-lg">Tomorrow, 11:00 AM</Button>
                  <Button variant="unstyled" size="none" onClick={() => applyPreset("tomorrow-15")} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-dark-2 rounded-lg">Tomorrow, 3:00 PM</Button>
                </div>
                
                <div className="p-3 border-t border-gray-100 dark:border-gray-800 flex justify-between gap-2 mt-2">
                  <Button variant="unstyled" size="none" onClick={() => setShowSendLater(false)} className="px-4 py-1.5 text-sm font-medium hover:bg-gray-50 dark:hover:bg-dark-2 rounded-lg text-gray-600 dark:text-gray-300">Cancel</Button>
                  <Button variant="unstyled" size="none" onClick={applyCustomDateTime} className="px-6 py-1.5 text-sm font-medium bg-white text-[#10C35B] rounded-full border border-[#10C35B] hover:bg-[#EEF5F0]">Done</Button>
                </div>
              </div>
            )}
          </div>
          
          <Button 
            variant="unstyled" size="none"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="px-6 py-1.5 text-sm font-semibold text-[#10C35B] bg-white border border-[#10C35B] hover:bg-[#EEF5F0] dark:bg-dark-2 dark:hover:bg-green-950/30 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Sending..." : (scheduledIso ? "Send Later" : "Send")}
          </Button>
        </div>
      </header>
      
      {scheduledLabel && (
        <div className="bg-[#EEF5F0] dark:bg-green-950/20 px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-[#10C35B]">
            <Clock className="w-4 h-4" />
            Scheduled for: <strong>{scheduledLabel}</strong>
          </div>
          <Button variant="unstyled" size="none" onClick={clearSchedule} className="text-sm font-medium text-[#10C35B] hover:underline">
            Clear
          </Button>
        </div>
      )}
    </>
  );
}
