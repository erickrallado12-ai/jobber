"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, Briefcase, FileText, Wrench, Users } from "lucide-react";
import type { FieldErrors } from "react-hook-form";
import type { JobPostingFormData } from "@/lib/validations/job";
import { SECTION_FIELDS } from "@/lib/validations/job";

interface SidebarSection {
  id: string;
  label: string;
  icon: React.ElementType;
}

const SECTIONS: SidebarSection[] = [
  { id: "details", label: "Job Details", icon: Briefcase },
  { id: "about", label: "About the Job", icon: FileText },
  { id: "skills", label: "Skills & Benefits", icon: Wrench },
  { id: "hiring", label: "Hiring Stage", icon: Users },
];

interface FormSidebarProps {
  activeSection: string;
  errors: FieldErrors<JobPostingFormData>;
  onNavigate: (sectionId: string) => void;
}

export function FormSidebar({ activeSection, errors, onNavigate }: FormSidebarProps) {
  const sectionsWithErrors = useMemo(() => {
    const set = new Set<string>();
    for (const [sectionId, fields] of Object.entries(SECTION_FIELDS)) {
      for (const field of fields) {
        const parts = field.split(".");
        let err: unknown = errors;
        for (const part of parts) {
          err = err && typeof err === "object" ? (err as Record<string, unknown>)[part] : undefined;
        }
        if (err && typeof err === "object" && "message" in err) {
          set.add(sectionId);
          break;
        }
      }
    }
    return set;
  }, [errors]);

  return (
    <nav className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-3">
        Sections
      </p>
      {SECTIONS.map((section) => {
        const isActive = activeSection === section.id;
        const hasError = sectionsWithErrors.has(section.id);
        const Icon = section.icon;

        return (
          <button
            key={section.id}
            onClick={() => onNavigate(section.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left",
              isActive
                ? "bg-muted text-foreground border border-border"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
            )}
          >
            <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-foreground" : "")} />
            <span className="flex-1">{section.label}</span>
            {hasError && (
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive" />
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
