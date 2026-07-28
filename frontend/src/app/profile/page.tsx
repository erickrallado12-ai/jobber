"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { AuthGuard } from "@/components/auth-guard";
import { listApplications } from "@/lib/api";
import type { JobApplication } from "@/types/jobs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  Phone,
  Briefcase,
  MapPin,
  Calendar,
  Clock,
  ArrowRight,
  FileText,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  Building2,
  Wifi,
  DollarSign,
  Tag,
} from "lucide-react";

function formatDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatSalary(min: number | null, max: number | null, currency: string): string {
  const fmt = (n: number) => {
    if (n >= 1000) return `${Math.round(n / 1000)}k`;
    return String(n);
  };
  const sym = currency === "USD" ? "$" : currency + " ";
  if (min && max) return `${sym}${fmt(min)}–${fmt(max)}`;
  if (min) return `From ${sym}${fmt(min)}`;
  if (max) return `Up to ${sym}${fmt(max)}`;
  return "";
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  pending: { label: "Pending", icon: Clock, color: "text-zinc-600", bg: "bg-zinc-100" },
  reviewing: { label: "Reviewing", icon: FileText, color: "text-blue-600", bg: "bg-blue-50" },
  shortlisted: { label: "Shortlisted", icon: CheckCircle2, color: "text-indigo-600", bg: "bg-indigo-50" },
  interviewing: { label: "Interviewing", icon: Calendar, color: "text-teal-600", bg: "bg-teal-50" },
  offered: { label: "Offered", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
  rejected: { label: "Rejected", icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
  withdrawn: { label: "Withdrawn", icon: AlertCircle, color: "text-orange-600", bg: "bg-orange-50" },
};

function ProfileContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const apps = await listApplications();
        if (!cancelled) setApplications(apps);
      } catch {
        if (!cancelled) setApplications([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (!user) return null;

  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === "pending" || a.status === "reviewing").length,
    interviews: applications.filter((a) => a.status === "shortlisted" || a.status === "interviewing").length,
    offered: applications.filter((a) => a.status === "offered").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  };

  const initials = getInitials(`${user.first_name} ${user.last_name}`);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-gray-50/50 to-white">
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {}
        <div className="rounded-xl border border-gray-200 bg-white p-8">
          <div className="flex items-start gap-6">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-teal-500/20">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-foreground">
                {user.first_name} {user.last_name}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="bg-teal-100 text-teal-700 border-teal-200 text-xs capitalize">
                  {user.role}
                </Badge>
              </div>
              <div className="flex items-center gap-5 mt-4 text-sm text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-4 w-4 text-teal-400" />
                  {user.email}
                </span>
                {user.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-4 w-4 text-teal-400" />
                    {user.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Total Applied" value={stats.total} icon={Briefcase} iconBg="bg-teal-100" iconColor="text-teal-600" />
          <StatCard label="Pending Review" value={stats.pending} icon={Clock} iconBg="bg-coral-100" iconColor="text-coral-600" />
          <StatCard label="Interviews" value={stats.interviews} icon={Calendar} iconBg="bg-indigo-100" iconColor="text-indigo-600" />
          <StatCard label="Offers" value={stats.offered} icon={TrendingUp} iconBg="bg-emerald-100" iconColor="text-emerald-600" />
        </div>

        {}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-coral-500" />
              My Applications
            </h2>
            <Link
              href="/jobs"
              className="text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors flex items-center gap-1"
            >
              Browse more jobs <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
              <div className="flex items-center justify-center gap-3 text-muted-foreground">
                <svg className="animate-spin h-5 w-5 text-teal-500" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Loading applications...
              </div>
            </div>
          ) : applications.length === 0 ? (
            <div className="rounded-xl border border-dashed border-teal-200 bg-white p-12 text-center">
              <Briefcase className="h-12 w-12 text-teal-200 mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">No applications yet</p>
              <p className="text-sm text-muted-foreground/60 mt-1 mb-6">
                Start applying to jobs to track your progress here.
              </p>
              <Button asChild className="btn-primary" size="sm">
                <Link href="/jobs">
                  Find Jobs <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => {
                const cfg = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.pending;
                const Icon = cfg.icon;
                const salary = formatSalary(app.job_salary_min, app.job_salary_max, app.job_salary_currency);
                return (
                  <button
                    key={app.id}
                    onClick={() => router.push(`/profile/application/${app.id}`)}
                    className="w-full text-left rounded-xl border border-gray-200 bg-white p-5 hover:border-gray-300 hover:shadow-md hover:shadow-gray-500/5 transition-all group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white shrink-0">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-foreground group-hover:text-teal-700 transition-colors truncate">
                              {app.job_title}
                            </h3>
                            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                              {app.job_location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3 text-teal-400" />
                                  {app.job_location}
                                </span>
                              )}
                              {app.job_is_remote && (
                                <span className="flex items-center gap-1">
                                  <Wifi className="h-3 w-3 text-teal-400" />
                                  Remote
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-teal-400" />
                                Applied {formatDate(app.applied_at)}
                              </span>
                            </div>
                          </div>
                          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${cfg.bg} ${cfg.color}`}>
                            <Icon className="h-3 w-3" />
                            {cfg.label}
                          </div>
                        </div>

                        {}
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          {app.job_employment_type && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-teal-50 border border-teal-100 px-2 py-0.5 text-xs text-teal-700">
                              <Briefcase className="h-3 w-3" />
                              {app.job_employment_type}
                            </span>
                          )}
                          {salary && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                              <DollarSign className="h-3 w-3" />
                              {salary}
                            </span>
                          )}
                          {app.job_department && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-xs text-indigo-700">
                              <Tag className="h-3 w-3" />
                              {app.job_department}
                            </span>
                          )}
                          {app.job_skills?.slice(0, 3).map((skill) => (
                            <span key={skill} className="rounded-md bg-gray-100 border border-gray-200 px-2 py-0.5 text-xs text-gray-600">
                              {skill}
                            </span>
                          ))}
                          {(app.job_skills?.length ?? 0) > 3 && (
                            <span className="text-xs text-muted-foreground">+{app.job_skills.length - 3} more</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  iconBg,
  iconColor,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 hover:border-gray-300 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`h-9 w-9 rounded-lg ${iconBg} flex items-center justify-center`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <AuthGuard requiredRole="candidate">
      <ProfileContent />
    </AuthGuard>
  );
}
