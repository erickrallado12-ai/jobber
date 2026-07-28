"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { Job } from "@/types/jobs";
import { getJob } from "@/lib/api";
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
  ExternalLink,
  Share2,
  CheckCircle2,
} from "lucide-react";

function formatSalary(job: Job): string | null {
  if (!job.salary_min && !job.salary_max) return null;
  const fmt = (n: number) => `$${n.toLocaleString()}`;
  if (job.salary_min && job.salary_max)
    return `${fmt(job.salary_min)} – ${fmt(job.salary_max)} / year`;
  if (job.salary_min) return `From ${fmt(job.salary_min)} / year`;
  return `Up to ${fmt(job.salary_max!)} / year`;
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

export default function CandidateJobDetailPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getJob(jobId)
      .then(setJob)
      .catch(() => setJob(null))
      .finally(() => setLoading(false));
  }, [jobId]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          Loading job...
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Job not found.</p>
          <Button variant="outline" onClick={() => router.push("/jobs")}>
            Back to Search
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-gray-50/50 to-white">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-teal-700 transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to search
        </button>

        <div className="grid grid-cols-3 gap-8">
          {}
          <div className="col-span-2 space-y-6">
            {}
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
          </div>

          {}
          <div className="space-y-4">
            {}
            <div className="rounded-xl border border-gray-200 bg-white p-5 sticky top-24">
              <Button
                asChild
                className="w-full btn-primary h-11 text-base font-semibold"
              >
                <Link href={`/apply/${job.id}`}>
                  Apply Now
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Link>
              </Button>

              <button
                onClick={handleShare}
                className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Share2 className="h-4 w-4" />
                {copied ? "Link Copied!" : "Share Job"}
              </button>

              {}
              <div className="mt-5 pt-5 border-t border-gray-200 space-y-4">
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
