"use client";

import { X, FileText } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { FileUploadDropZone } from "@/components/ui/FileUploadDropZone";
import { AttachmentFile } from "./ComposeTypes";
import Button from "@/components/ui/Button";

interface ComposeAttachmentsProps {
  attachments: AttachmentFile[];
  removeAttachment: (id: string) => void;
  showInlineDropzone: boolean;
  setShowInlineDropzone: (v: boolean) => void;
  processNewFiles: (files: FileList | File[]) => void;
}

const isImageFile = (file: AttachmentFile) =>
  !!file.previewUrl && (file.previewUrl.startsWith("blob:") || /\.(jpe?g|gif|png|webp)$/i.test(file.name));

export function ComposeAttachments({
  attachments,
  removeAttachment,
  showInlineDropzone,
  setShowInlineDropzone,
  processNewFiles
}: ComposeAttachmentsProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* File Dropzone */}
      {showInlineDropzone && (
        <div className="relative rounded-xl border border-dashed border-[#10C35B] bg-[#EEF5F0] dark:bg-green-950/20 p-4 transition-colors">
          <Button 
            variant="unstyled" size="none"
            type="button"
            onClick={() => setShowInlineDropzone(false)}
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 bg-white dark:bg-dark-3 rounded-full p-1 border border-gray-200 dark:border-gray-700"
          >
            <X className="w-4 h-4" />
          </Button>
          <FileUploadDropZone 
            onDropFiles={(files) => {
              processNewFiles(files);
              setShowInlineDropzone(false);
            }} 
          />
        </div>
      )}

      {/* Gmail-style attachment thumbnails */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {attachments.map((file) => (
            <div
              key={file.id}
              className="group relative flex h-[104px] w-[96px] flex-col overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-2"
            >
              <Button
                variant="unstyled" size="none"
                type="button"
                onClick={() => removeAttachment(file.id)}
                className="absolute right-1 top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                title="Remove attachment"
              >
                <X className="h-3 w-3" />
              </Button>

              {isImageFile(file) ? (
                <div className="relative h-[68px] w-full shrink-0 bg-gray-100 dark:bg-gray-800">
                  <SmartImage src={file.previewUrl} alt={file.name} fill className="object-cover" />
                </div>
              ) : (
                <div className="flex h-[68px] w-full shrink-0 items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-400">
                  <FileText className="h-6 w-6" />
                </div>
              )}

              <div className="flex flex-1 flex-col justify-center px-1.5 py-1">
                <span className="truncate text-[11px] font-medium text-gray-700 dark:text-gray-300" title={file.name}>
                  {file.name}
                </span>
                <span className="text-[10px] text-gray-400">{file.size}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
