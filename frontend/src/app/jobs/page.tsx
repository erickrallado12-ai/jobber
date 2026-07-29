"use client";

import { useState, useEffect, useCallback, useMemo, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Job } from "@/types/jobs";
import { listJobs, getJob } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CityInput } from "@/components/ui/city-input";
import { KeywordInput } from "@/components/ui/keyword-input";
import {
  MapPin,
  Briefcase,
  Clock,
  Search,
  X,
  SlidersHorizontal,
  ArrowUpDown,
  DollarSign,
  CheckCircle2,
  Share2,
  ExternalLink,
  Building2,
  Users,
  Globe,
} from "lucide-react";

function formatSalary(job: Job): string | null {
  if (!job.salary_min && !job.salary_max) return null;
  const fmt = (n: number) => `$${(n / 1000).toFixed(0)}k`;
  if (job.salary_min && job.salary_max) return `${fmt(job.salary_min)} – ${fmt(job.salary_max)}`;
  if (job.salary_min) return `From ${fmt(job.salary_min)}`;
  return `Up to ${fmt(job.salary_max!)}`;
}

function formatSalaryFull(job: Job): string | null {
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
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

const EMPLOYMENT_TYPES = [
  { value: "", label: "All Types" },
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
];

export default function JobsPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-64px)] flex items-center justify-center"><svg className="animate-spin h-5 w-5 text-teal-500" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg></div>}>
      <JobsSearchContent />
    </Suspense>
  );
}

function JobsSearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";
  const initialCity = searchParams.get("city") ?? "";
  const initialJobId = searchParams.get("job") ?? "";

  const [keyword, setKeyword] = useState(initialQ);
  const [city, setCity] = useState(initialCity);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [filterType, setFilterType] = useState("");
  const [filterRemote, setFilterRemote] = useState(false);
  const [sortBy, setSortBy] = useState<"newest" | "salary">("newest");

  const [selectedJobId, setSelectedJobId] = useState<string>(initialJobId);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedLoading, setSelectedLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);

  const fetchJobs = useCallback(async (q: string, c: string) => {
    setLoading(true);
    try {
      const params: Parameters<typeof listJobs>[0] = { status: "open", limit: 50 };
      if (q) params.q = q;
      if (c) params.city = c;
      const data = await listJobs(params);
      setJobs(data);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs(initialQ, initialCity);
  }, [initialQ, initialCity, fetchJobs]);

  useEffect(() => {
    if (jobs.length > 0 && !selectedJobId) {
      setSelectedJobId(jobs[0].id);
    }
  }, [jobs, selectedJobId]);

  useEffect(() => {
    if (!selectedJobId) {
      setSelectedJob(null);
      return;
    }
    setSelectedLoading(true);
    getJob(selectedJobId)
      .then(setSelectedJob)
      .catch(() => setSelectedJob(null))
      .finally(() => setSelectedLoading(false));
  }, [selectedJobId]);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const params = new URLSearchParams();
      if (keyword.trim()) params.set("q", keyword.trim());
      if (city.trim()) params.set("city", city.trim());
      router.push(`/jobs${params.toString() ? `?${params.toString()}` : ""}`);
    },
    [keyword, city, router]
  );

  const filtered = useMemo(() => {
    let result = [...jobs];
    if (filterType) result = result.filter((j) => j.employment_type === filterType);
    if (filterRemote) result = result.filter((j) => j.is_remote);
    if (sortBy === "salary") {
      result.sort((a, b) => (b.salary_max ?? 0) - (a.salary_max ?? 0));
    }
    return result;
  }, [jobs, filterType, filterRemote, sortBy]);

  const activeFilterCount = (filterType ? 1 : 0) + (filterRemote ? 1 : 0);

  const handleSelectJob = useCallback((jobId: string) => {
    setSelectedJobId(jobId);
    const params = new URLSearchParams();
    if (initialQ) params.set("q", initialQ);
    if (initialCity) params.set("city", initialCity);
    params.set("job", jobId);
    router.replace(`/jobs?${params.toString()}`, { scroll: false });
  }, [initialQ, initialCity, router]);

  const handleShare = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const activeJob = selectedJob;

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-gradient-to-b from-gray-50 to-white">
      {}
      <div className="bg-white border-b border-gray-200 shrink-0">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <form onSubmit={handleSearch} className="flex items-center gap-3">
            <KeywordInput
              value={keyword}
              onChange={setKeyword}
              placeholder="Job title, keywords, or company"
              className="flex-1"
            />
            <div className="flex-1 flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gray-100/60 border border-transparent focus-within:border-gray-300 focus-within:bg-white transition-all">
              <CityInput
                value={city}
                onChange={setCity}
                placeholder="City or state..."
                className="flex-1"
              />
              {city && (
                <button type="button" onClick={() => setCity("")} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button
              type="submit"
              className="btn-primary px-5"
            >
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </form>
        </div>
      </div>

      {}
      <div className="flex-1 flex overflow-hidden max-w-7xl mx-auto w-full">
        {}
        <div className="w-[40%] flex flex-col border-r border-gray-200 bg-white">
          {}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 shrink-0">
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground">
                {loading ? "Searching..." : `${filtered.length} job${filtered.length !== 1 ? "s" : ""}`}
              </p>
              {(initialQ || initialCity) && (
                <div className="flex items-center gap-1.5">
                  {initialQ && (
                    <Badge variant="secondary" className="gap-1 text-[10px] bg-teal-100 text-teal-700 border-teal-200">
                      {initialQ}
                      <button onClick={() => { setKeyword(""); router.push(`/jobs?city=${initialCity}`); }}>
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  )}
                  {initialCity && (
                    <Badge variant="secondary" className="gap-1 text-[10px] bg-teal-100 text-teal-700 border-teal-200">
                      {initialCity}
                      <button onClick={() => { setCity(""); router.push(`/jobs${initialQ ? `?q=${initialQ}` : ""}`); }}>
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                  showFilters || activeFilterCount
                    ? "border-teal-200 bg-teal-50 text-teal-700"
                    : "border-gray-200 text-muted-foreground hover:text-teal-700 hover:bg-teal-50"
                }`}
              >
                <SlidersHorizontal className="h-3 w-3" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-0.5 h-3.5 w-3.5 rounded-full bg-teal-600 text-white text-[9px] flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setSortBy(sortBy === "newest" ? "salary" : "newest")}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border border-gray-200 text-muted-foreground hover:text-teal-700 hover:bg-teal-50 transition-colors"
              >
                <ArrowUpDown className="h-3 w-3" />
                {sortBy === "newest" ? "Newest" : "Salary"}
              </button>
            </div>
          </div>

          {}
          {showFilters && (
            <div className="px-5 py-3 border-b border-gray-200 bg-white flex items-center gap-4 flex-wrap shrink-0">
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground">Type</label>
                <div className="flex gap-1">
                  {EMPLOYMENT_TYPES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setFilterType(t.value)}
                      className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                        filterType === t.value
                          ? "bg-teal-600 text-white"
                          : "bg-teal-50 text-muted-foreground hover:text-teal-700"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground">Work Model</label>
                <div className="flex gap-1">
                  <button
                    onClick={() => setFilterRemote(false)}
                    className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                      !filterRemote ? "bg-teal-600 text-white" : "bg-teal-50 text-muted-foreground hover:text-teal-700"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilterRemote(true)}
                    className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                      filterRemote ? "bg-teal-600 text-white" : "bg-teal-50 text-muted-foreground hover:text-teal-700"
                    }`}
                  >
                    Remote
                  </button>
                </div>
              </div>
              {activeFilterCount > 0 && (
                <button
                  onClick={() => { setFilterType(""); setFilterRemote(false); }}
                  className="text-[10px] text-teal-600 hover:text-teal-700 underline underline-offset-2"
                >
                  Clear all
                </button>
              )}
            </div>
          )}

          {}
          <div ref={listRef} className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-4 rounded-lg border border-gray-200 animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-teal-100" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-2/3 rounded bg-teal-100" />
                        <div className="h-3 w-1/3 rounded bg-teal-50" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 px-6">
                <Briefcase className="h-10 w-10 text-teal-200 mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground mb-1">No jobs found</p>
                <p className="text-xs text-muted-foreground">Try adjusting your search or filters.</p>
              </div>
            ) : (
              <div className="divide-y divide-teal-100">
                {filtered.map((job) => (
                  <button
                    key={job.id}
                    onClick={() => handleSelectJob(job.id)}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                      selectedJobId === job.id
                        ? "bg-gray-100/50 border-l-2 border-l-teal-600"
                        : "border-l-2 border-l-transparent"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-sm shadow-teal-500/20">
                        {job.title.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-foreground truncate">
                          {job.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          {job.location && (
                            <span className="flex items-center gap-0.5">
                              <MapPin className="h-3 w-3 text-teal-400" />
                              {job.location}
                            </span>
                          )}
                          {job.is_remote && (
                            <span className="flex items-center gap-0.5 text-emerald-600">
                              <span className="h-1 w-1 rounded-full bg-emerald-500" />
                              Remote
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          {formatSalary(job) && (
                            <span className="text-xs font-medium text-foreground">{formatSalary(job)}</span>
                          )}
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <Clock className="h-2.5 w-2.5" />
                            {timeAgo(job.created_at)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-teal-100 text-teal-700 border-teal-200">{job.employment_type}</Badge>
                          {job.skills.slice(0, 3).map((s) => (
                            <Badge key={s} variant="outline" className="text-[9px] px-1.5 py-0 border-teal-200 text-teal-600">{s}</Badge>
                          ))}
                          {job.skills.length > 3 && (
                            <span className="text-[9px] text-muted-foreground">+{job.skills.length - 3}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {}
        <div className="w-[60%] overflow-y-auto bg-gradient-to-b from-white to-teal-50/20">
          {selectedLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex items-center gap-3 text-muted-foreground">
                <svg className="animate-spin h-5 w-5 text-teal-500" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Loading job details...
              </div>
            </div>
          ) : !activeJob ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Briefcase className="h-12 w-12 text-teal-200 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Select a job to view details</p>
              </div>
            </div>
          ) : (
            <div className="p-6 max-w-2xl">
              {}
              <div className="flex items-start gap-4 mb-6">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-xl font-bold text-white shrink-0 shadow-lg shadow-teal-500/20">
                  {activeJob.title.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-bold text-foreground">{activeJob.title}</h1>
                  <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground flex-wrap">
                    {activeJob.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-teal-400" />
                        {activeJob.location}
                      </span>
                    )}
                    {activeJob.is_remote && (
                      <span className="flex items-center gap-1 text-emerald-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Remote
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-teal-400" />
                      {timeAgo(activeJob.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge className="bg-teal-100 text-teal-700 border-teal-200 hover:bg-teal-100">{activeJob.employment_type}</Badge>
                    {activeJob.department && <Badge variant="outline" className="border-coral-200 text-coral-700">{activeJob.department}</Badge>}
                  </div>
                </div>
              </div>

              {}
              <div className="flex items-center gap-3 mb-6">
                <Button
                  asChild
                  className="btn-primary"
                >
                  <Link href={`/apply/${activeJob.id}`}>
                    Apply Now
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-teal-200 text-sm font-medium text-teal-700 hover:bg-teal-50 transition-colors"
                >
                  <Share2 className="h-4 w-4" />
                  {copied ? "Copied!" : "Share"}
                </button>
              </div>

              {}
              {(formatSalaryFull(activeJob) || activeJob.team_size) && (
                <div className="rounded-xl border border-gray-200 bg-white p-4 mb-5 flex items-center gap-6">
                  {formatSalaryFull(activeJob) && (
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-coral-100 flex items-center justify-center">
                        <DollarSign className="h-4 w-4 text-coral-600" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Salary</p>
                        <p className="text-sm font-medium text-foreground">{formatSalaryFull(activeJob)}</p>
                      </div>
                    </div>
                  )}
                  {activeJob.department && (
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-teal-100 flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-teal-600" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Department</p>
                        <p className="text-sm font-medium text-foreground">{activeJob.department}</p>
                      </div>
                    </div>
                  )}
                  {activeJob.team_size && (
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-teal-100 flex items-center justify-center">
                        <Users className="h-4 w-4 text-teal-600" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Team Size</p>
                        <p className="text-sm font-medium text-foreground">{activeJob.team_size}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <Globe className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Work Model</p>
                      <p className="text-sm font-medium text-foreground">
                        {activeJob.is_remote ? "Remote" : "On-site"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {}
              <div className="rounded-xl border border-gray-200 bg-white p-5 mb-4">
                <h2 className="text-sm font-semibold text-foreground mb-3">About the Role</h2>
                <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {activeJob.description}
                </div>
              </div>

              {}
              {activeJob.responsibilities.length > 0 && (
                <div className="rounded-xl border border-gray-200 bg-white p-5 mb-4">
                  <h2 className="text-sm font-semibold text-foreground mb-3">Responsibilities</h2>
                  <ul className="space-y-2">
                    {activeJob.responsibilities.map((r, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-teal-400 mt-0.5 shrink-0" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {}
              {activeJob.requirements && (
                <div className="rounded-xl border border-gray-200 bg-white p-5 mb-4">
                  <h2 className="text-sm font-semibold text-foreground mb-3">Requirements</h2>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {activeJob.requirements}
                  </div>
                </div>
              )}

              {}
              {activeJob.skills.length > 0 && (
                <div className="rounded-xl border border-gray-200 bg-white p-5 mb-4">
                  <h2 className="text-sm font-semibold text-foreground mb-3">Skills</h2>
                  <div className="flex flex-wrap gap-2">
                    {activeJob.skills.map((s) => (
                      <Badge key={s} className="bg-teal-100 text-teal-700 border-teal-200 hover:bg-teal-100">{s}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {}
              {activeJob.benefits.length > 0 && (
                <div className="rounded-xl border border-gray-200 bg-white p-5">
                  <h2 className="text-sm font-semibold text-foreground mb-3">Benefits & Perks</h2>
                  <div className="flex flex-wrap gap-2">
                    {activeJob.benefits.map((b) => (
                      <Badge key={b} variant="outline" className="border-coral-200 text-coral-700">{b}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
