"use client";

import {
  User,
  FileText,
  Briefcase,
  GraduationCap,
  Wrench,
  Zap,
  Mail,
  Phone,
  MapPin,
  LinkIcon,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { JobApplication } from "@/types/jobs";
import { updateApplicationStatus } from "@/lib/api";

interface ResumeSheetProps {
  application: JobApplication | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange?: (applicationId: string, newStatus: string) => void;
}

function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function dateRange(start: string, end: string, isCurrent: boolean): string {
  const s = formatDate(start);
  const e = isCurrent ? "Present" : formatDate(end);
  if (s && e) return `${s} — ${e}`;
  if (s) return s;
  return "";
}

function ScoreBadge({ score }: { score: number }) {
  const pct = (score * 100).toFixed(0);
  let color = "bg-muted text-muted-foreground";
  if (score >= 0.8) color = "bg-emerald-50 text-emerald-700 border-emerald-200";
  else if (score < 0.5) color = "bg-red-50 text-red-700 border-red-200";
  else if (score >= 0.5) color = "bg-coral-50 text-coral-700 border-coral-200";
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border", color)}>
      <Zap className="h-3 w-3" />
      {pct}% match
    </span>
  );
}

export function ResumeSheet({
  application,
  open,
  onOpenChange,
  onStatusChange,
}: ResumeSheetProps) {
  if (!application) return null;

  const resume = application.resume_data as Record<string, unknown>;
  const personal = (resume.personal_details ?? {}) as Record<string, string>;
  const bio = (resume.bio as string) ?? "";
  const experience = (resume.experience ?? []) as Array<{
    id?: string;
    company?: string;
    position?: string;
    location?: string;
    start_date?: string;
    end_date?: string;
    is_current?: boolean;
    highlights?: string[];
  }>;
  const education = (resume.education ?? []) as Array<{
    id?: string;
    institution?: string;
    degree?: string;
    field_of_study?: string;
    start_date?: string;
    end_date?: string;
    gpa?: string;
    description?: string;
  }>;
  const skills = (resume.skills ?? []) as string[];

  function getLinkedinUrl(): string | null {
    const links = resume.links as Record<string, string> | undefined;
    if (links?.linkedin) return links.linkedin;
    const profiles = resume.profiles as Array<{ platform: string; url: string }> | undefined;
    return profiles?.find((p) => p.platform.toLowerCase().includes("linkedin"))?.url ?? null;
  }

  async function handleStatus(newStatus: string) {
    if (!application) return;
    await updateApplicationStatus(application.id, newStatus);
    onStatusChange?.(application.id, newStatus);
    onOpenChange(false);
  }

  const linkedin = getLinkedinUrl();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-0">
        <div className="p-6 space-y-6">
          {}
          <SheetHeader className="space-y-3">
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center text-lg font-bold text-foreground shrink-0">
                {personal.first_name?.[0]}{personal.last_name?.[0]}
              </div>
              <div className="min-w-0 flex-1">
                <SheetTitle className="text-xl">
                  {application.candidate_name}
                </SheetTitle>
                <SheetDescription className="flex items-center gap-3 mt-1 flex-wrap">
                  <ScoreBadge score={application.ai_score} />
                  <Badge variant="outline" className="text-xs capitalize">
                    {application.status}
                  </Badge>
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          {}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>{application.candidate_email}</span>
            </div>
            {personal.phone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{personal.phone}</span>
              </div>
            )}
            {personal.address && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{personal.address}</span>
              </div>
            )}
            {linkedin && (
              <a
                href={linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <LinkIcon className="h-4 w-4" />
                <span>LinkedIn Profile</span>
              </a>
            )}
          </div>

          {}
          {application.ai_summary && (
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Zap className="h-4 w-4 text-coral-500" />
                AI Match Summary
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {application.ai_summary}
              </p>
            </div>
          )}

          {}
          {bio && (
            <Section icon={FileText} title="About">
              <p className="text-sm text-muted-foreground leading-relaxed">{bio}</p>
            </Section>
          )}

          {}
          {experience.length > 0 && (
            <Section icon={Briefcase} title="Experience">
              <div className="space-y-4">
                {experience.map((exp, i) => (
                  <div key={exp.id ?? i} className="relative pl-4 border-l-2 border-border">
                    <div className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-foreground" />
                    <p className="text-sm font-medium text-foreground">
                      {exp.position}
                      {exp.company && (
                        <span className="text-muted-foreground font-normal"> at {exp.company}</span>
                      )}
                    </p>
                    {(exp.start_date || exp.end_date) && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {dateRange(exp.start_date ?? "", exp.end_date ?? "", exp.is_current ?? false)}
                        {exp.location && ` · ${exp.location}`}
                      </p>
                    )}
                    {exp.highlights && exp.highlights.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {exp.highlights.map((h, j) => (
                          <li key={j} className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <span className="mt-1 h-1 w-1 rounded-full bg-muted-foreground/40 shrink-0" />
                            {h}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {}
          {education.length > 0 && (
            <Section icon={GraduationCap} title="Education">
              <div className="space-y-4">
                {education.map((edu, i) => (
                  <div key={edu.id ?? i} className="relative pl-4 border-l-2 border-border">
                    <div className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-foreground" />
                    <p className="text-sm font-medium text-foreground">
                      {edu.degree}
                      {edu.field_of_study && (
                        <span className="text-muted-foreground font-normal"> in {edu.field_of_study}</span>
                      )}
                    </p>
                    {edu.institution && (
                      <p className="text-xs text-muted-foreground mt-0.5">{edu.institution}</p>
                    )}
                    {(edu.start_date || edu.end_date) && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {dateRange(edu.start_date ?? "", edu.end_date ?? "", false)}
                      </p>
                    )}
                    {edu.gpa && (
                      <p className="text-xs text-muted-foreground mt-0.5">GPA: {edu.gpa}</p>
                    )}
                    {edu.description && (
                      <p className="text-xs text-muted-foreground mt-1">{edu.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {}
          {skills.length > 0 && (
            <Section icon={Wrench} title="Skills">
              <div className="flex flex-wrap gap-1.5">
                {skills.map((s) => (
                  <Badge key={s} variant="secondary" className="text-xs">
                    {s}
                  </Badge>
                ))}
              </div>
            </Section>
          )}

          {}
          <div className="flex items-center gap-3 pt-4 border-t border-border">
            {application.status !== "shortlisted" && (
              <Button
                size="sm"
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => handleStatus("shortlisted")}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Shortlist
              </Button>
            )}
            {application.status !== "rejected" && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                onClick={() => handleStatus("rejected")}
              >
                Reject
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {title}
      </div>
      {children}
    </div>
  );
}
