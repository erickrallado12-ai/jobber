"use client";

import { useState, useCallback } from "react";
import { Upload, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

export function UploadZone({ onFileSelect, isProcessing }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const files = e.dataTransfer.files;
      if (files?.[0]) {
        onFileSelect(files[0]);
      }
    },
    [onFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files?.[0]) {
        onFileSelect(files[0]);
      }
    },
    [onFileSelect]
  );

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="relative">
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-foreground animate-spin" />
          </div>
          <div className="absolute inset-0 rounded-full border-2 border-muted-foreground/20 animate-ping" />
        </div>
        <div className="space-y-2">
          <p className="text-lg font-semibold text-foreground">Processing your resume</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            Extracting text and analyzing content with AI...
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="flex gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-foreground animate-bounce [animation-delay:-0.3s]" />
            <span className="h-1.5 w-1.5 rounded-full bg-foreground animate-bounce [animation-delay:-0.15s]" />
            <span className="h-1.5 w-1.5 rounded-full bg-foreground animate-bounce" />
          </div>
          This may take a moment
        </div>
      </div>
    );
  }

  return (
    <div
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={cn(
        "relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-16 text-center transition-all cursor-pointer group",
          isDragging
          ? "border-foreground bg-muted scale-[1.02]"
          : "border-muted-foreground/20 hover:border-foreground/50 hover:bg-muted/30"
      )}
      onClick={() => {
        const input = document.getElementById("upload-input") as HTMLInputElement;
        input?.click();
      }}
    >
      <div
        className={cn(
          "h-16 w-16 rounded-2xl flex items-center justify-center mb-6 transition-colors",
          isDragging ? "bg-muted" : "bg-muted group-hover:bg-muted-foreground/10"
        )}
      >
        <FileText
          className={cn(
            "h-8 w-8 transition-colors",
            isDragging ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
          )}
        />
      </div>

      <div className="space-y-2 mb-6">
        <p className="text-lg font-semibold text-foreground">
          Drop your resume here
        </p>
        <p className="text-sm text-muted-foreground">
          or click to browse. PDF or DOCX up to 10MB.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-full px-3 py-1.5">
          <Upload className="h-3 w-3" />
          Drag & drop
        </div>
        <div className="text-xs text-muted-foreground">or</div>
        <div className="text-sm font-medium text-foreground hover:text-muted-foreground transition-colors">
          Browse files
        </div>
      </div>

      <input
        id="upload-input"
        type="file"
        className="hidden"
        accept=".pdf,.docx"
        onChange={handleFileInput}
      />
    </div>
  );
}
