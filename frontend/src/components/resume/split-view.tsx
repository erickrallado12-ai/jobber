"use client";

import { useState, useCallback } from "react";
import { UploadZone } from "./upload-zone";
import { PdfViewer } from "./pdf-viewer";
import { ResumeStepper } from "./resume-stepper";
import { ProcessingSkeleton } from "./processing-skeleton";
import { uploadResume } from "@/lib/api";
import { defaultResume, type Resume } from "@/types/resume";

type AppView = "upload" | "processing" | "editor";

export function SplitView() {
  const [view, setView] = useState<AppView>("upload");
  const [resume, setResume] = useState<Resume>(defaultResume);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    const url = URL.createObjectURL(file);
    setFileUrl(url);
    setView("processing");
    setError(null);

    try {
      const parsed = await uploadResume(file);
      setResume(parsed);
      setView("editor");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process resume");
      setView("upload");
    }
  }, []);

  return (
    <div className="flex-1 flex flex-col">
      {error && (
        <div className="px-6 py-2 bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {view === "upload" && (
        <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-white to-muted/20 p-8">
          <div className="w-full max-w-xl">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-muted text-foreground rounded-full px-4 py-1.5 text-sm font-medium mb-6">
                <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
                AI-Powered Resume Builder
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-3">
                Get matched to your next role
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Upload your CV and our AI will extract your profile, then match you against open positions.
              </p>
            </div>
            <UploadZone onFileSelect={handleFileSelect} isProcessing={false} />
          </div>
        </div>
      )}

      {view === "processing" && <ProcessingSkeleton fileUrl={fileUrl} />}

      {view === "editor" && (
        <div className="flex-1 flex overflow-hidden">
          <div className="w-full lg:w-[45%] flex flex-col bg-white border-r border-border overflow-hidden">
            <ResumeStepper resume={resume} onUpdate={setResume} />
          </div>
          <div className="hidden lg:flex w-full lg:w-[55%] bg-slate-50 items-center justify-center p-8">
            <PdfViewer fileUrl={fileUrl} />
          </div>
        </div>
      )}
    </div>
  );
}
