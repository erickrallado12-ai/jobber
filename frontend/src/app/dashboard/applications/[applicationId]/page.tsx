"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  LinkIcon,
  Briefcase,
  GraduationCap,
  Wrench,
  Zap,
  FileText,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getApplication, updateApplicationStatus } from "@/lib/api";
import type { JobApplication } from "@/types/jobs";

function formatDate(iso: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric" });
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
    <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border", color)}>
      <Zap className="h-4 w-4" />
      {pct}% match
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-zinc-100 text-zinc-700 border-zinc-200",
    reviewing: "bg-zinc-100 text-zinc-700 border-zinc-200",
    shortlisted: "bg-indigo-50 text-indigo-700 border-indigo-200",
    interviewing: "bg-indigo-50 text-indigo-700 border-indigo-200",
    offered: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rejected: "bg-red-50 text-red-700 border-red-200",
    withdrawn: "bg-red-50 text-red-700 border-red-200",
  };
  const labels: Record<string, string> = {
    pending: "Pending",
    reviewing: "Reviewing",
    shortlisted: "Shortlisted",
    interviewing: "Interviewing",
    offered: "Offered",
    rejected: "Rejected",
    withdrawn: "Withdrawn",
  };
  return (
    <Badge variant="outline" className={cn("text-xs font-medium capitalize", styles[status] ?? "")}>
      {labels[status] ?? status}
    </Badge>
  );
}

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.applicationId as string;

  const [application, setApplication] = useState<JobApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    getApplication(applicationId)
      .then(setApplication)
      .catch(() => setError("Application not found"))
      .finally(() => setLoading(false));
  }, [applicationId]);

  const handleStatus = useCallback(
    async (newStatus: string) => {
      if (!application) return;
      setUpdating(true);
      try {
        await updateApplicationStatus(application.id, newStatus);
        setApplication((prev) => (prev ? { ...prev, status: newStatus as JobApplication["status"] } : prev));
      } finally {
        setUpdating(false);
      }
    },
    [application]
  );

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground">{error ?? "Application not found"}</p>
          <Button variant="outline" asChild>
            <Link href="/dashboard/applications">Back to Applications</Link>
          </Button>
        </div>
      </div>
    );
  }

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

  const linkedin = getLinkedinUrl();

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-gray-50/50 to-white">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {}
        <Link
          href="/dashboard/applications"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-teal-700 transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Applications
        </Link>

        {}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-5">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-xl font-bold text-foreground shrink-0">
              {personal.first_name?.[0]}
              {personal.last_name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    {application.candidate_name}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Applied to <span className="font-medium text-foreground">{application.job_title}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <ScoreBadge score={application.ai_score} />
                  <StatusBadge status={application.status} />
                </div>
              </div>

              {}
              <div className="flex items-center gap-4 mt-4 flex-wrap text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-4 w-4 text-teal-600" />
                  {application.candidate_email}
                </span>
                {personal.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-4 w-4 text-teal-600" />
                    {personal.phone}
                  </span>
                )}
                {personal.address && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-teal-600" />
                    {personal.address}
                  </span>
                )}
                {linkedin && (
                  <a
                    href={linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                  >
                    <LinkIcon className="h-4 w-4 text-teal-600" />
                    LinkedIn
                  </a>
                )}
              </div>
            </div>
          </div>

          {}
          <div className="flex items-center gap-3 mt-6 pt-5 border-t border-gray-200">
            {application.status !== "shortlisted" && (
              <Button
                size="sm"
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={updating}
                onClick={() => handleStatus("shortlisted")}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Shortlist
              </Button>
            )}
            {application.status !== "interviewing" && application.status !== "rejected" && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                disabled={updating}
                onClick={() => handleStatus("interviewing")}
              >
                <Briefcase className="h-4 w-4" />
                Move to Interview
              </Button>
            )}
            {application.status !== "rejected" && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                disabled={updating}
                onClick={() => handleStatus("rejected")}
              >
                Reject
              </Button>
            )}
          </div>
        </div>

        {}
        {(application.ai_summary || (application.ai_strengths && application.ai_strengths.length > 0) || (application.ai_gaps && application.ai_gaps.length > 0)) && (
          <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-4">
              <Zap className="h-4 w-4 text-coral-500" />
              AI Match Analysis
            </div>

            {}
            <div className="flex items-start gap-4 mb-5">
              <div className={cn(
                "flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold border",
                application.ai_score >= 0.8 ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                application.ai_score >= 0.5 ? "bg-coral-50 text-coral-700 border-coral-200" :
                "bg-red-50 text-red-700 border-red-200"
              )}>
                {(application.ai_score * 100).toFixed(0)}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {application.ai_summary}
              </p>
            </div>

            {}
            {application.ai_strengths && application.ai_strengths.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2">Strengths</p>
                <ul className="space-y-1.5">
                  {application.ai_strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {}
            {application.ai_gaps && application.ai_gaps.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-coral-600 uppercase tracking-wide mb-2">Areas for Improvement</p>
                <ul className="space-y-1.5">
                  {application.ai_gaps.map((g, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <AlertTriangle className="h-4 w-4 text-coral-500 mt-0.5 shrink-0" />
                      {g}
                    </li>
                  ))}
                </ul>
              </div>
            )}
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
            <div className="space-y-5">
              {experience.map((exp, i) => (
                <div key={exp.id ?? i} className="relative pl-5 border-l-2 border-gray-200">
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
                        <li key={j} className="text-xs text-muted-foreground flex items-start gap-2">
                          <span className="mt-1.5 h-1 w-1 rounded-full bg-muted-foreground/40 shrink-0" />
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
            <div className="space-y-5">
              {education.map((edu, i) => (
                <div key={edu.id ?? i} className="relative pl-5 border-l-2 border-gray-200">
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
                    <p className="text-xs text-muted-foreground mt-1.5">{edu.description}</p>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {}
        {skills.length > 0 && (
          <Section icon={Wrench} title="Skills">
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <Badge key={s} variant="secondary" className="text-xs">
                  {s}
                </Badge>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
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
    <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-4">
        <Icon className="h-4 w-4 text-teal-600" />
        {title}
      </div>
      {children}
    </div>
  );
}
