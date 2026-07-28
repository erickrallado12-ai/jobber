"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Job } from "@/types/jobs";
import { getJob, deleteJob, updateJob, listJobApplicants } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Share2,
  ExternalLink,
  Trash2,
  ToggleLeft,
  MapPin,
  Clock,
  DollarSign,
  Building2,
  Users,
  Globe,
  CheckCircle2,
} from "lucide-react";

interface Applicant {
  id: string;
  user_id: string;
  candidate_name: string;
  candidate_email: string;
  ai_score: number;
  ai_summary: string;
  status: string;
  applied_at: string;
}

function formatSalary(job: Job): string | null {
  if (!job.salary_min && !job.salary_max) return null;
  const fmt = (n: number) => `$${n.toLocaleString()}`;
  if (job.salary_min && job.salary_max) return `${fmt(job.salary_min)} – ${fmt(job.salary_max)} / year`;
  if (job.salary_min) return `From ${fmt(job.salary_min)} / year`;
  return `Up to ${fmt(job.salary_max!)} / year`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

export default function RecruiterJobDetailPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const j = await getJob(jobId);
      setJob(j);
      try {
        const apps = await listJobApplicants(jobId);
        setApplicants(apps);
      } catch {
        setApplicants([]);
      }
    } catch {
      setJob(null);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    if (!confirm("Delete this job? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await deleteJob(jobId);
      router.push("/dashboard");
    } catch {
      alert("Failed to delete job");
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!job) return;
    const newStatus = job.status === "open" ? "closed" : "open";
    try {
      const updated = await updateJob(jobId, { status: newStatus });
      setJob(updated);
    } catch {
      alert("Failed to update status");
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/apply/${jobId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <svg className="animate-spin h-5 w-5 text-teal-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          Loading...
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Job not found.</p>
          <Button variant="outline" onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-gray-50/50 to-white">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <button onClick={() => router.push("/dashboard")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-teal-700 transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </button>

        <div className="grid grid-cols-3 gap-8">
          {}
          <div className="col-span-2 space-y-5">
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="flex items-start gap-5">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-xl font-bold text-white shrink-0 shadow-lg shadow-teal-500/20">
                  {job.title.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <h1 className="text-2xl font-bold text-foreground">{job.title}</h1>
                    <Badge className={job.status === "open" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-zinc-100 text-zinc-700 border-zinc-200"}>
                      {job.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                    {job.location && <span className="flex items-center gap-1"><MapPin className="h-4 w-4 text-teal-400" />{job.location}</span>}
                    {job.is_remote && <span className="flex items-center gap-1 text-emerald-600"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Remote</span>}
                    <span className="flex items-center gap-1"><Clock className="h-4 w-4 text-teal-400" />{timeAgo(job.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="text-base font-semibold text-foreground mb-3">Description</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{job.description}</p>
            </div>

            {job.requirements && (
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <h2 className="text-base font-semibold text-foreground mb-3">Requirements</h2>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{job.requirements}</p>
              </div>
            )}

            {job.responsibilities.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <h2 className="text-base font-semibold text-foreground mb-3">Responsibilities</h2>
                <ul className="space-y-2">
                  {job.responsibilities.map((r, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-teal-400 mt-0.5 shrink-0" />{r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {job.skills.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <h2 className="text-base font-semibold text-foreground mb-3">Skills</h2>
                <div className="flex flex-wrap gap-2">{job.skills.map((s) => <Badge key={s} className="bg-teal-100 text-teal-700 border-teal-200 hover:bg-teal-100">{s}</Badge>)}</div>
              </div>
            )}

            {job.benefits.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <h2 className="text-base font-semibold text-foreground mb-3">Benefits</h2>
                <div className="flex flex-wrap gap-2">{job.benefits.map((b) => <Badge key={b} variant="outline" className="border-coral-200 text-coral-700">{b}</Badge>)}</div>
              </div>
            )}

            {}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Applicants ({applicants.length})</h2>
              {applicants.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">No applicants yet.</div>
              ) : (
                <div className="space-y-3">
                  {applicants.map((app) => (
                    <div key={app.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-gray-50/50">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-sm font-semibold text-white shadow-sm shadow-teal-500/20">
                          {app.candidate_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{app.candidate_name}</p>
                          <p className="text-xs text-muted-foreground">{app.candidate_email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-semibold text-foreground">{Math.round(app.ai_score * 100)}% match</p>
                          <p className="text-xs text-muted-foreground">{app.status}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">{new Date(app.applied_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {}
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 bg-white p-5 sticky top-24 space-y-3">
              <Button onClick={handleShare} variant="outline" className="w-full text-sm gap-2 border-teal-200 text-teal-700 hover:bg-teal-50">
                <Share2 className="h-4 w-4" />{copied ? "Link Copied!" : "Copy Apply Link"}
              </Button>
              <Button asChild variant="outline" className="w-full text-sm gap-2 border-teal-200 text-teal-700 hover:bg-teal-50">
                <a href={`/apply/${jobId}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />View as Candidate
                </a>
              </Button>
              <Button onClick={handleToggleStatus} variant="outline" className="w-full text-sm gap-2 border-teal-200 text-teal-700 hover:bg-teal-50">
                <ToggleLeft className="h-4 w-4" />{job.status === "open" ? "Close Job" : "Reopen Job"}
              </Button>
              <Button onClick={handleDelete} variant="outline" className="w-full text-sm gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" disabled={deleting}>
                <Trash2 className="h-4 w-4" />{deleting ? "Deleting..." : "Delete Job"}
              </Button>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Job Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3"><Building2 className="h-4 w-4 text-teal-400 shrink-0" /><span className="text-muted-foreground">Department:</span><span className="font-medium">{job.department || "—"}</span></div>
                <div className="flex items-center gap-3"><Globe className="h-4 w-4 text-teal-400 shrink-0" /><span className="text-muted-foreground">Type:</span><span className="font-medium capitalize">{job.employment_type}</span></div>
                {formatSalary(job) && <div className="flex items-center gap-3"><DollarSign className="h-4 w-4 text-coral-500 shrink-0" /><span className="text-muted-foreground">Salary:</span><span className="font-medium">{formatSalary(job)}</span></div>}
                {job.team_size && <div className="flex items-center gap-3"><Users className="h-4 w-4 text-teal-400 shrink-0" /><span className="text-muted-foreground">Team:</span><span className="font-medium">{job.team_size}</span></div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
