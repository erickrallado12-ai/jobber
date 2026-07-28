"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import type { JobPostingFormData } from "@/lib/validations/job";

interface PreviewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: JobPostingFormData;
}

export function PreviewSheet({ open, onOpenChange, data }: PreviewSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>Job Posting Preview</SheetTitle>
          <SheetDescription>
            Review how this job listing will appear to candidates.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {}
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {data.title || "Untitled Position"}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-muted-foreground">
              {data.department && <span>{data.department}</span>}
              {data.department && data.location && <span className="text-border">|</span>}
              {data.location && <span>{data.location}</span>}
              {data.isRemote && (
                <Badge variant="secondary" className="text-xs">Remote</Badge>
              )}
            </div>
            {(data.salaryMin || data.salaryMax) && (
              <p className="text-sm font-medium text-foreground mt-2">
                {data.salaryMin && data.salaryMax
                  ? `$${data.salaryMin.toLocaleString()} – $${data.salaryMax.toLocaleString()}`
                  : data.salaryMin
                  ? `From $${data.salaryMin.toLocaleString()}`
                  : `Up to $${data.salaryMax?.toLocaleString()}`}
                <span className="text-muted-foreground font-normal"> / year</span>
              </p>
            )}
          </div>

          {}
          {data.description && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">About the Role</h3>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {data.description}
              </div>
            </div>
          )}

          {}
          {data.responsibilities.some((r) => r.value) && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Responsibilities</h3>
              <ul className="space-y-1.5">
                {data.responsibilities
                  .filter((r) => r.value)
                  .map((r, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-foreground mt-0.5">•</span>
                      {r.value}
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {}
          {data.requirements && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Requirements</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {data.requirements}
              </p>
            </div>
          )}

          {}
          {data.skills.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Skills</h3>
              <div className="flex flex-wrap gap-1.5">
                {data.skills.map((skill) => (
                  <Badge key={skill} variant="outline" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {}
          {data.benefits.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Benefits</h3>
              <div className="flex flex-wrap gap-1.5">
                {data.benefits.map((b) => (
                  <Badge key={b} variant="secondary" className="text-xs">
                    {b}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {}
          <div className="pt-4 border-t border-border text-xs text-muted-foreground space-y-1">
            <p>Type: {data.employmentType}</p>
            {data.applicationDeadline && <p>Deadline: {data.applicationDeadline}</p>}
            {data.maxApplicants && <p>Max applicants: {data.maxApplicants}</p>}
            {data.teamSize && <p>Team size: {data.teamSize}</p>}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
