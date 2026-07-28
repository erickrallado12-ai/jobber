"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { generateJobDescription } from "@/lib/api";

interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
  jobTitle?: string;
  label?: string;
  placeholder?: string;
  error?: string;
}

export function RichTextEditor({
  value,
  onChange,
  jobTitle,
  label = "About the Job",
  placeholder = "Describe the role, what a day looks like, and why someone would want this job...",
  error: fieldError,
}: RichTextEditorProps) {
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  async function handleGenerate() {
    if (!jobTitle?.trim()) return;
    setGenerating(true);
    setGenerateError(null);
    try {
      const description = await generateJobDescription(jobTitle, value);
      onChange(description);
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : "Failed to generate description");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">{label}</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleGenerate}
          disabled={!jobTitle?.trim() || generating}
          className="gap-1.5 text-foreground border-border hover:bg-muted hover:text-foreground"
        >
          {generating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          {generating ? "Generating..." : "Generate with AI"}
        </Button>
      </div>
      <div className="relative">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={12}
          className="resize-y min-h-[200px]"
        />
        {generateError && <p className="text-sm text-destructive mt-1">{generateError}</p>}
        {fieldError && <p className="text-sm text-destructive mt-1">{fieldError}</p>}
      </div>
      <p className="text-xs text-muted-foreground">
        Tip: Enter a Job Title above, then click &quot;Generate with AI&quot; to auto-fill.
      </p>
    </div>
  );
}
