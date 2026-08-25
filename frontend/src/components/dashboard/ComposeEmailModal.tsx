"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import { Label } from "@/components/ui/label";
import { UploadCloud, Plus, Send, X, FileText } from "lucide-react";
import Papa from "papaparse";
import { toast } from "sonner";

export function ComposeEmailModal() {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [startTime, setStartTime] = useState("");
  const [delay, setDelay] = useState("2");
  const [hourlyLimit, setHourlyLimit] = useState("200");
  
  const [file, setFile] = useState<File | null>(null);
  const [emailCount, setEmailCount] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    
    // Parse CSV to count emails
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Assume one of the columns might be 'email' or we just count rows if it's a simple list
        const rows = results.data as Record<string, string>[];
        // Try to find a column named 'email' (case insensitive)
        let validEmails = 0;
        
        if (rows.length > 0) {
          const headers = Object.keys(rows[0]).map(h => h.toLowerCase());
          const emailHeader = headers.find(h => h.includes('email'));
          
          if (emailHeader) {
            // Count valid emails in that column
            const originalHeader = Object.keys(rows[0]).find(h => h.toLowerCase() === emailHeader)!;
            validEmails = rows.filter(r => r[originalHeader] && r[originalHeader].includes('@')).length;
          } else {
            // If no header found, just count rows as fallback
            validEmails = rows.length;
          }
        }
        
        setEmailCount(validEmails);
        toast.success(`Detected ${validEmails} email addresses.`);
      },
      error: (error) => {
        toast.error(`Error parsing file: ${error.message}`);
        setFile(null);
        setEmailCount(null);
      }
    });
  };

  const clearFile = () => {
    setFile(null);
    setEmailCount(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !body || !file) {
      toast.error("Please fill all required fields and upload a lead list.");
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success("Campaign scheduled successfully!");
      setOpen(false);
      // Reset form
      setSubject("");
      setBody("");
      setStartTime("");
      setDelay("2");
      setHourlyLimit("200");
      clearFile();
    } catch (error) {
      toast.error("Failed to schedule campaign.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 px-6">
          <Plus className="w-4 h-4" />
          Compose New Email
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-150 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Schedule New Campaign</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                placeholder="Exciting news from ReachInbox!"
                value={subject}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSubject(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="body">Email Body *</Label>
              <Textarea
                id="body"
                placeholder="Hi {{name}},&#10;&#10;I wanted to reach out because..."
                className="min-h-37.5 resize-y"
                value={body}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBody(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Lead List (CSV/TXT) *</Label>
              {!file ? (
                <div 
                  className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadCloud className="w-8 h-8 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium">Click to upload or drag and drop</p>
                  <p className="text-xs text-muted-foreground mt-1">CSV or TXT file with an 'email' column</p>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/20">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium truncate max-w-50 sm:max-w-xs">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {emailCount !== null ? `${emailCount} valid emails detected` : "Parsing..."}
                      </p>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={clearFile}
                    className="p-1.5 hover:bg-destructive/10 text-destructive rounded-md transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv,.txt"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-border/50">
              <div className="space-y-2">
                <Label htmlFor="startTime" className="text-xs">Start Time (Optional)</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={startTime}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="delay" className="text-xs">Delay (seconds)</Label>
                <Input
                  id="delay"
                  type="number"
                  min="1"
                  value={delay}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDelay(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="limit" className="text-xs">Hourly Limit</Label>
                <Input
                  id="limit"
                  type="number"
                  min="1"
                  value={hourlyLimit}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHourlyLimit(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !file} className="gap-2">
              {isSubmitting ? (
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Schedule Campaign
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
