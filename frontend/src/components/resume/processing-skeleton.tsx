"use client";

import { useEffect, useState } from "react";
import { FileText } from "lucide-react";

interface Props {
  fileUrl: string | null;
}

function SkeletonLine({ className }: { className?: string }) {
  return (
    <div className={`h-3 rounded-full bg-muted animate-pulse ${className ?? ""}`} />
  );
}

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div className={`h-10 rounded-lg bg-muted animate-pulse ${className ?? ""}`} />
  );
}

const MESSAGES = [
  { time: 0, text: "Extracting text from your resume..." },
  { time: 15, text: "Analyzing document structure..." },
  { time: 35, text: "Organizing your information..." },
  { time: 55, text: "Almost there..." },
];

export function ProcessingSkeleton({ fileUrl }: Props) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const current =
    [...MESSAGES].reverse().find((m) => elapsed >= m.time) ?? MESSAGES[0];

  return (
    <div className="h-full flex overflow-hidden">
      <div className="w-[45%] bg-white border-r border-border p-6 flex flex-col">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center flex-1 last:flex-none">
                <SkeletonBlock className="h-10 w-10 shrink-0" />
                {i < 4 && (
                  <div className="flex-1 mx-1 mb-5">
                    <SkeletonLine className="h-[2px] w-full" />
                  </div>
                )}
              </div>
            ))}
          </div>
          <SkeletonLine className="h-6 w-48 mb-2" />
          <SkeletonLine className="h-4 w-64" />
        </div>

        <div className="space-y-4 flex-1">
          <div className="flex items-center gap-4">
            <SkeletonBlock className="h-20 w-20 rounded-full shrink-0" />
            <div className="space-y-2">
              <SkeletonLine className="h-3 w-24" />
              <SkeletonLine className="h-3 w-16" />
            </div>
          </div>
          <SkeletonBlock className="h-10 w-full" />
          <div className="grid grid-cols-2 gap-4">
            <SkeletonBlock className="h-10 w-full" />
            <SkeletonBlock className="h-10 w-full" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <SkeletonBlock className="h-10 w-full" />
            <SkeletonBlock className="h-10 w-full" />
          </div>
          <SkeletonBlock className="h-10 w-full" />
          <SkeletonBlock className="h-10 w-full" />
        </div>

        <div className="flex justify-between pt-4 border-t mt-4">
          <SkeletonBlock className="h-10 w-24" />
          <SkeletonBlock className="h-10 w-28 bg-foreground/10" />
        </div>
      </div>

      <div className="w-[55%] bg-slate-50 flex items-center justify-center p-8">
        {fileUrl ? (
          <div className="bg-white rounded-xl shadow-xl overflow-hidden w-[420px]">
            <div className="h-[560px] flex items-center justify-center">
              <div className="flex flex-col items-center gap-5">
                <div className="relative h-16 w-16">
                  <svg
                    className="h-16 w-16 -rotate-90 animate-spin"
                    viewBox="0 0 64 64"
                    style={{ animationDuration: "2s" }}
                  >
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      fill="none"
                      stroke="currentColor"
                      className="text-muted-foreground/20"
                      strokeWidth="4"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      fill="none"
                      stroke="currentColor"
                      className="text-foreground"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray="175.9"
                      strokeDashoffset="130"
                    />
                  </svg>
                </div>

                <div className="text-center space-y-1">
                  <p className="text-sm font-medium text-foreground/80">
                    {current.text}
                  </p>
                  <p className="text-[11px] text-muted-foreground/50 tabular-nums">
                    {elapsed}s elapsed
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-border/40 bg-gradient-to-r from-muted via-muted/80 to-muted px-5 py-2.5 flex items-center gap-2.5">
              <div className="flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-foreground animate-bounce [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-foreground animate-bounce [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-foreground animate-bounce" />
              </div>
              <span className="text-[11px] text-muted-foreground/60">
                Processing your document
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center max-w-sm">
            <FileText className="h-20 w-20 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-lg font-medium text-foreground/70">No document</p>
          </div>
        )}
      </div>
    </div>
  );
}
