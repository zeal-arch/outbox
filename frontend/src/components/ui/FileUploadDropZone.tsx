"use client";

import { useId, useRef, useState } from "react";
import { UploadCloud, CheckCircle2, AlertCircle, X, FileText, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const getReadableFileSize = (bytes: number) => {
  if (bytes === 0) return "0 KB";
  const suffixes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.floor(bytes / Math.pow(1024, i)) + " " + suffixes[i];
};

interface FileUploadDropZoneProps {
  className?: string;
  hint?: string;
  isDisabled?: boolean;
  accept?: string;
  allowsMultiple?: boolean;
  maxSize?: number;
  onDropFiles?: (files: FileList | File[]) => void;
}

export const FileUploadDropZone = ({
  className,
  hint,
  isDisabled,
  accept = "image/*",
  allowsMultiple = true,
  maxSize = 10 * 1024 * 1024, // 10MB
  onDropFiles,
}: FileUploadDropZoneProps) => {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragIn = (event: React.DragEvent<HTMLDivElement>) => {
    if (isDisabled) return;
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragOut = (event: React.DragEvent<HTMLDivElement>) => {
    if (isDisabled) return;
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(false);
  };

  const processFiles = (files: File[]) => {
    setError(null);
    if (!files || files.length === 0) return;

    const oversized = files.filter(f => f.size > maxSize);
    if (oversized.length > 0) {
      setError(`Some files exceed the ${getReadableFileSize(maxSize)} size limit.`);
      return;
    }

    if (onDropFiles) {
      onDropFiles(allowsMultiple ? files : files.slice(0, 1));
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    if (isDisabled) return;
    handleDragOut(event);
    processFiles(Array.from(event.dataTransfer.files));
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(Array.from(event.target.files || []));
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div
      onDragOver={handleDragIn}
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragEnd={handleDragOut}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "relative flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-[#1E1E1E]/50 px-6 py-5 text-center cursor-pointer transition-all duration-150 ease-in-out hover:bg-gray-100/60 dark:hover:bg-[#252525]",
        isDraggingOver && "border-primary bg-primary/5 dark:bg-primary/10",
        isDisabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      <input
        ref={inputRef}
        id={id}
        type="file"
        className="hidden"
        disabled={isDisabled}
        accept={accept}
        multiple={allowsMultiple}
        onChange={handleInputChange}
      />
      
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-[#2A2A2A] shadow-sm ring-1 ring-gray-200 dark:ring-gray-700">
        <UploadCloud className="h-5 w-5 text-primary" />
      </div>

      <div className="flex flex-col gap-0.5">
        <p className="text-sm font-medium text-dark dark:text-white">
          <span className="text-primary hover:underline font-semibold">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {hint || "PNG, JPG, GIF or WebP (max. 10MB)"}
        </p>
      </div>

      {error && (
        <p className="text-xs text-red-500 font-medium mt-1">{error}</p>
      )}
    </div>
  );
};
