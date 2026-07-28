"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { AuthGuard } from "@/components/auth-guard";
import { getApplication, getJob } from "@/lib/api";
import type { JobApplication, Job } from "@/types/jobs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Clock,
  DollarSign,
  Building2,
  Users,
  Globe,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  Loader2,
  FileText,
  TrendingUp,
  XCircle,
  AlertCircle,
  Briefcase,
} from "lucide-react";

function formatDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

function formatSalary(job: Job): string | null {
  if (!job.salary_min && !job.salary_max) return null;
  const fmt = (n: number) => `$${n.toLocaleString()}`;
  if (job.salary_min && job.salary_max)
    return `${fmt(job.salary_min)} – ${fmt(job.salary_max)} / year`;
  if (job.salary_min) return `From ${fmt(job.salary_min)} / year`;
  return `Up to ${fmt(job.salary_max!)} / year`;
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  pending: { label: "Pending", icon: Clock, color: "text-zinc-600", bg: "bg-zinc-100", border: "border-zinc-200" },
  reviewing: { label: "Reviewing", icon: FileText, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
  shortlisted: { label: "Shortlisted", icon: CheckCircle2, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-200" },
  interviewing: { label: "Interviewing", icon: Calendar, color: "text-teal-600", bg: "bg-teal-50", border: "border-teal-200" },
  offered: { label: "Offered", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
  rejected: { label: "Rejected", icon: XCircle, color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
  withdrawn: { label: "Withdrawn", icon: AlertCircle, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" },
};

const STATUS_STEPS = ["pending", "reviewing", "shortlisted", "interviewing", "offered"];

function ApplicationStatusTimeline({ status }: { status: string }) {
  const currentIdx = STATUS_STEPS.indexOf(status);
  const isRejected = status === "rejected";
  const isWithdrawn = status === "withdrawn";
  const isTerminal = isRejected || isWithdrawn || status === "offered";

  return (
    <div className="flex items-center gap-0 w-full">
      {STATUS_STEPS.map((step, idx) => {
        const isCompleted = !isTerminal && currentIdx >= idx;
        const isCurrent = step === status;
        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`h-3 w-3 rounded-full border-2 transition-all ${
                  isCurrent
                    ? "border-teal-600 bg-teal-600 ring-4 ring-teal-100"
                    : isCompleted
                    ? "border-teal-600 bg-teal-600"
                    : "border-gray-300 bg-white"
                }`}
              />
              <span
                className={`text-[10px] font-medium whitespace-nowrap ${
                  isCurrent ? "text-teal-700" : isCompleted ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {STATUS_CONFIG[step]?.label}
              </span>
            </div>
            {idx < STATUS_STEPS.length - 1 && (
              <div className="flex-1 mx-1 mb-5">
                <div
                  className={`h-[2px] w-full ${
                    !isTerminal && currentIdx > idx ? "bg-teal-600" : "bg-gray-200"
                  }`}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ApplicationDetailContent() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const applicationId = params.applicationId as string;

  const [application, setApplication] = useState<JobApplication | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const app = await getApplication(applicationId);
        if (cancelled) return;
        setApplication(app);
        try {
          const j = await getJob(app.job_id);
          if (!cancelled) setJob(j);
        } catch {
        }
      } catch {
        if (!cancelled) setError("Application not found");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, applicationId]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-teal-500" />
          Loading application...
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground">{error ?? "Application not found"}</p>
          <Button variant="outline" asChild>
            <a href="/profile">Back to Profile</a>
          </Button>
        </div>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[application.status] ?? STATUS_CONFIG.pending;
  const StatusIcon = statusCfg.icon;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-gray-50/50 to-white">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {}
        <button
          onClick={() => router.push("/profile")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-teal-700 transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to profile
        </button>

        <div className="grid grid-cols-3 gap-8">
          {}
          <div className="col-span-2 space-y-6">
            {}
            {job ? (
              <>
                <div className="rounded-xl border border-gray-200 bg-white p-6">
                  <div className="flex items-start gap-5">
                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-teal-500/20 shrink-0">
                      {job.title.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h1 className="text-2xl font-bold text-foreground">{job.title}</h1>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                        {job.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {job.location}
                          </span>
                        )}
                        {job.is_remote && (
                          <span className="flex items-center gap-1 text-green-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                            Remote
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {timeAgo(job.created_at)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <Badge variant="secondary">{job.employment_type}</Badge>
                        {job.department && <Badge variant="outline">{job.department}</Badge>}
                      </div>
                    </div>
                  </div>
                </div>

                {}
                <div className="rounded-xl border border-gray-200 bg-white p-6">
                  <h2 className="text-base font-semibold text-foreground mb-4">About the Role</h2>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {job.description}
                  </div>
                </div>

                {}
                {job.responsibilities.length > 0 && (
                  <div className="rounded-xl border border-gray-200 bg-white p-6">
                    <h2 className="text-base font-semibold text-foreground mb-4">Responsibilities</h2>
                    <ul className="space-y-2">
                      {job.responsibilities.map((r, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                          <CheckCircle2 className="h-4 w-4 text-teal-400 mt-0.5 shrink-0" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {}
                {job.requirements && (
                  <div className="rounded-xl border border-gray-200 bg-white p-6">
                    <h2 className="text-base font-semibold text-foreground mb-4">Requirements</h2>
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {job.requirements}
                    </div>
                  </div>
                )}

                {}
                {job.skills.length > 0 && (
                  <div className="rounded-xl border border-gray-200 bg-white p-6">
                    <h2 className="text-base font-semibold text-foreground mb-4">Skills</h2>
                    <div className="flex flex-wrap gap-2">
                      {job.skills.map((s) => (
                        <Badge key={s} variant="secondary">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {}
                {job.benefits.length > 0 && (
                  <div className="rounded-xl border border-gray-200 bg-white p-6">
                    <h2 className="text-base font-semibold text-foreground mb-4">Benefits & Perks</h2>
                    <div className="flex flex-wrap gap-2">
                      {job.benefits.map((b) => (
                        <Badge key={b} variant="outline">{b}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <div className="flex items-start gap-5">
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-teal-500/20 shrink-0">
                    {application.job_title.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-bold text-foreground">{application.job_title}</h1>
                    {application.job_location && (
                      <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {application.job_location}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      {application.job_employment_type && <Badge variant="secondary">{application.job_employment_type}</Badge>}
                      {application.job_department && <Badge variant="outline">{application.job_department}</Badge>}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {}
          <div className="space-y-4">
            {}
            <div className="rounded-xl border border-gray-200 bg-white p-5 sticky top-24">
              <div className="flex items-center gap-3 mb-4">
                <div className={`h-10 w-10 rounded-lg ${statusCfg.bg} flex items-center justify-center`}>
                  <StatusIcon className={`h-5 w-5 ${statusCfg.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Application Status</p>
                  <p className={`text-sm font-semibold ${statusCfg.color}`}>{statusCfg.label}</p>
                </div>
              </div>

              {}
              <div className="mb-5">
                <ApplicationStatusTimeline status={application.status} />
              </div>

              {}
              <div className="pt-4 border-t border-gray-200 space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Applied</p>
                    <p className="text-sm font-medium text-foreground">{formatDate(application.applied_at)}</p>
                  </div>
                </div>
                {job && (
                  <>
                    {formatSalary(job) && (
                      <div className="flex items-center gap-3">
                        <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Salary</p>
                          <p className="text-sm font-medium text-foreground">{formatSalary(job)}</p>
                        </div>
                      </div>
                    )}
                    {job.department && (
                      <div className="flex items-center gap-3">
                        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Department</p>
                          <p className="text-sm font-medium text-foreground">{job.department}</p>
                        </div>
                      </div>
                    )}
                    {job.team_size && (
                      <div className="flex items-center gap-3">
                        <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Team Size</p>
                          <p className="text-sm font-medium text-foreground">{job.team_size}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Work Model</p>
                        <p className="text-sm font-medium text-foreground">
                          {job.is_remote ? "Remote" : "On-site"}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {}
              {job && (
                <Button
                  asChild
                  variant="outline"
                  className="w-full mt-4"
                >
                  <a href={`/jobs/${job.id}`}>
                    <Briefcase className="h-4 w-4 mr-2" />
                    View Full Job Posting
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ApplicationDetailPage() {
  return (
    <AuthGuard requiredRole="candidate">
      <ApplicationDetailContent />
    </AuthGuard>
  );
}
