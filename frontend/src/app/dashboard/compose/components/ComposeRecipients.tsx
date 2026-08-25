"use client";

import { useRef, useState, useCallback } from "react";
import { ChevronDown, X, Upload } from "lucide-react";
import Papa from "papaparse";
import { toast } from "sonner";
import { useAuth } from "@/components/providers";
import Button from "@/components/ui/Button";

interface ComposeRecipientsProps {
  parsedEmails: any[];
  setParsedEmails: React.Dispatch<React.SetStateAction<any[]>>;
}

export function ComposeRecipients({
  parsedEmails,
  setParsedEmails
}: ComposeRecipientsProps) {
  const { user } = useAuth();
  const [toInput, setToInput] = useState("");
  const [showAllChips, setShowAllChips] = useState(false);
  const csvFileInputRef = useRef<HTMLInputElement>(null);

  const getEmailStr = (obj: any) => typeof obj === 'string' ? obj : obj.email;

  const addEmailsFromText = useCallback((text: string) => {
    const rawList = text.split(/[\s,;]+/).map(e => e.trim()).filter(Boolean);
    const validEmails = rawList.filter(email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
    
    if (validEmails.length > 0) {
      setParsedEmails(prev => {
        const existing = new Set(prev.map(getEmailStr));
        const newEmails = validEmails.filter(e => !existing.has(e)).map(e => ({ email: e }));
        return [...prev, ...newEmails];
      });
      setToInput("");
      return true;
    }
    return false;
  }, [setParsedEmails]);

  const handleToKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === "Tab") {
      e.preventDefault();
      if (toInput.trim()) {
        const added = addEmailsFromText(toInput);
        if (!added) {
          toast.error("Please enter a valid email address");
        }
      }
    } else if (e.key === "Backspace" && !toInput && parsedEmails.length > 0) {
      setParsedEmails(prev => prev.slice(0, prev.length - 1));
    }
  };

  const removeEmail = (emailToRemove: string) => {
    setParsedEmails(prev => prev.filter(e => getEmailStr(e) !== emailToRemove));
  };

  // CSV/TXT Recipient List Parser
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as Record<string, string>[];
        let newRecipients: any[] = [];
        
        if (rows.length > 0) {
          const headers = Object.keys(rows[0]).map(h => h.toLowerCase());
          const emailHeader = headers.find(h => h.includes("email") || h.includes("mail") || h.includes("recipient"));
          
          if (emailHeader) {
            const originalHeader = Object.keys(rows[0]).find(h => h.toLowerCase() === emailHeader)!;
            
            rows.forEach(r => {
              const emailVal = r[originalHeader]?.trim();
              if (emailVal && emailVal.includes("@") && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
                const recipientObj: any = { email: emailVal };
                Object.keys(r).forEach(k => {
                  if (k !== originalHeader) recipientObj[k] = r[k];
                });
                newRecipients.push(recipientObj);
              }
            });
          }
        }
        
        if (newRecipients.length === 0) {
          toast.error("No valid email addresses found in file.");
          return;
        }

        setParsedEmails(prev => {
          const existing = new Set(prev.map(getEmailStr));
          const toAdd = newRecipients.filter(r => !existing.has(r.email));
          return [...prev, ...toAdd];
        });
        toast.success(`✅ ${newRecipients.length} recipients loaded`);
      },
      error: (error) => {
        toast.error(`Error parsing file: ${error.message}`);
      }
    });

    e.target.value = "";
  };

  const visibleEmails = showAllChips ? parsedEmails : parsedEmails.slice(0, 3);
  const extraCount = parsedEmails.length - 3;

  return (
    <>
      <input
        type="file"
        ref={csvFileInputRef}
        accept=".csv,.txt"
        className="hidden"
        onChange={handleCsvUpload}
      />
      
      {/* From Row */}
      <div className="flex items-center border-b border-gray-100 dark:border-gray-800 pb-4">
        <div className="w-[120px] text-[15px] font-medium text-gray-700 dark:text-gray-300 shrink-0">From</div>
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-dark-3 px-3.5 py-1.5 rounded-md border border-gray-100 dark:border-gray-800">
          <span className="text-[14px] font-medium text-gray-800 dark:text-gray-200">
            {user?.email || "oliver.brown@domain.io"}
          </span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* To Row */}
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4 relative">
        <div className="flex items-center flex-1 min-w-0 pr-32">
          <div className="w-[120px] text-[15px] font-medium text-gray-700 dark:text-gray-300 shrink-0">To</div>
          
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
            {visibleEmails.map((item, idx) => {
              const email = getEmailStr(item);
              const isObj = typeof item === 'object';
              const keys = isObj ? Object.keys(item).filter(k => k !== 'email') : [];
              return (
                <div 
                  key={idx} 
                  className="group flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#10C35B]/10 border border-[#10C35B] text-[#10C35B] text-[13px] font-medium transition-all"
                  title={keys.length > 0 ? `Variables: ${keys.join(', ')}` : email}
                >
                  <span className="truncate max-w-[200px]">{email}</span>
                  {keys.length > 0 && <span className="px-1.5 py-0.5 bg-[#10C35B]/20 rounded text-[10px] ml-1">{keys.length} vars</span>}
                  <Button 
                    variant="unstyled" size="none"
                    type="button" 
                    onClick={() => removeEmail(email)}
                    className="hover:bg-[#10C35B]/20 rounded-full p-0.5 text-[#10C35B]"
                    title="Remove recipient"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              );
            })}
            
            {!showAllChips && extraCount > 0 && (
              <Button 
                variant="unstyled" size="none"
                type="button"
                onClick={() => setShowAllChips(true)}
                className="flex items-center px-3 py-1 rounded-full bg-[#10C35B]/10 border border-[#10C35B] text-[#10C35B] text-[13px] font-medium hover:bg-[#10C35B]/20 transition-colors"
              >
                +{extraCount} more
              </Button>
            )}
            
            <input
              type="text"
              value={toInput}
              onChange={(e) => setToInput(e.target.value)}
              onKeyDown={handleToKeyDown}
              onBlur={() => {
                if (toInput.trim()) addEmailsFromText(toInput);
              }}
              placeholder={parsedEmails.length === 0 ? "recipient@example.com" : ""}
              className="flex-1 min-w-[150px] bg-transparent border-none outline-none text-[15px] placeholder:text-gray-400 dark:text-white"
            />
          </div>
        </div>

        <Button 
          variant="unstyled" size="none"
          type="button"
          onClick={() => csvFileInputRef.current?.click()}
          className="absolute right-0 top-0 flex items-center gap-1.5 text-[14px] font-medium text-[#10C35B] hover:opacity-80 transition-opacity"
        >
          <Upload className="w-4 h-4" />
          <span>Upload List</span>
        </Button>
      </div>
    </>
  );
}
