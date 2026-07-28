"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Job } from "@/types/jobs";
import { listJobs, type Job } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { CityInput } from "@/components/ui/city-input";
import { MapPin, Briefcase, Clock, ArrowRight, Sparkles, TrendingUp, Zap } from "lucide-react";

function formatSalary(job: Job): string | null {
  if (!job.salary_min && !job.salary_max) return null;
  const fmt = (n: number) => `$${(n / 1000).toFixed(0)}k`;
  if (job.salary_min && job.salary_max) return `${fmt(job.salary_min)} – ${fmt(job.salary_max)}`;
  if (job.salary_min) return `From ${fmt(job.salary_min)}`;
  return `Up to ${fmt(job.salary_max!)}`;
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

const TAG_COLORS = [
  "bg-teal-100 text-teal-700 border-teal-200 hover:bg-teal-200",
  "bg-coral-50 text-coral-700 border-coral-200 hover:bg-coral-100",
  "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
  "bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100",
];

export default function HomePage() {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [city, setCity] = useState("");
  const [featuredJobs, setFeaturedJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listJobs({ status: "open", limit: 6 })
      .then(setFeaturedJobs)
      .catch(() => setFeaturedJobs([]))
      .finally(() => setLoading(false));
  }, []);

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

  return (
    <div className="min-h-[calc(100vh-64px)]">
      {}
      <section className="hero-gradient relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal-300/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-coral-300/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-200/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-100 text-teal-700 text-xs font-medium mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered Job Matching
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-foreground tracking-tight leading-tight">
            Find your next{" "}
            <span className="gradient-text">career move</span>
          </h1>
          <p className="text-lg text-muted-foreground mt-4 max-w-xl mx-auto">
            Search thousands of jobs. Apply in seconds with AI-powered resume matching.
          </p>
        </div>
      </section>

      {}
      <div className="relative max-w-2xl mx-auto px-6 -mt-4" style={{ zIndex: 50 }}>
        <form onSubmit={handleSearch}>
          <div className="flex flex-col sm:flex-row items-stretch gap-3 bg-white p-3 rounded-2xl shadow-xl shadow-teal-500/8 border border-gray-200">
            <div className="flex-1 flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-100/60">
              <Briefcase className="h-4.5 w-4.5 text-teal-400 shrink-0" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Job title, keywords, or company"
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
            </div>
            <div className="flex-1 flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-100/60">
              <CityInput
                value={city}
                onChange={setCity}
                placeholder="City or state..."
              />
            </div>
            <button
              type="submit"
              className="btn-primary px-6 py-3 rounded-xl text-sm shrink-0"
            >
              Search Jobs
            </button>
          </div>
        </form>
        {}
        <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
          <span className="text-xs text-muted-foreground font-medium">Popular:</span>
          {["React Developer", "Product Manager", "Data Scientist", "Remote"].map(
            (tag, i) => (
              <button
                key={tag}
                onClick={() => {
                  setKeyword(tag);
                  const params = new URLSearchParams({ q: tag });
                  router.push(`/jobs?${params.toString()}`);
                }}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${TAG_COLORS[i % TAG_COLORS.length]}`}
              >
                {tag}
              </button>
            )
          )}
        </div>
      </div>

      {}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Zap className="h-6 w-6 text-coral-500" />
              Latest Openings
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Browse recent positions from top companies.
            </p>
          </div>
          <Link
            href="/jobs"
            className="text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors flex items-center gap-1"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-white p-5 animate-pulse">
                <div className="h-5 w-3/4 rounded bg-teal-100 mb-3" />
                <div className="h-3 w-1/2 rounded bg-muted mb-4" />
                <div className="flex gap-2">
                  <div className="h-6 w-16 rounded-full bg-teal-100" />
                  <div className="h-6 w-20 rounded-full bg-coral-100" />
                </div>
              </div>
            ))}
          </div>
        ) : !Array.isArray(featuredJobs) || featuredJobs.length === 0 ? (
          <div className="text-center py-16 rounded-xl border border-dashed border-teal-200 bg-gray-50/50">
            <Briefcase className="h-12 w-12 text-teal-300 mx-auto mb-4" />
            <p className="text-muted-foreground">No open positions yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredJobs.map((job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="group rounded-xl border border-border bg-white p-5 card-hover"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-md shadow-teal-500/20">
                    {job.title.charAt(0)}
                  </div>
                  <Badge variant="secondary" className="text-[10px] shrink-0 bg-coral-50 text-coral-700 border-coral-200">
                    {job.employment_type}
                  </Badge>
                </div>
                <h3 className="font-semibold text-foreground group-hover:text-teal-700 transition-colors truncate">
                  {job.title}
                </h3>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  {job.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-teal-400" />
                      {job.location}
                    </span>
                  )}
                  {job.is_remote && (
                    <span className="flex items-center gap-1 text-emerald-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Remote
                    </span>
                  )}
                </div>
                {formatSalary(job) && (
                  <p className="text-sm font-semibold text-foreground mt-3">
                    {formatSalary(job)}
                  </p>
                )}
                <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {timeAgo(job.created_at)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {}
      <section className="border-y border-border bg-gradient-to-r from-teal-50 via-gray-100 to-coral-50">
        <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <p className="text-3xl font-extrabold gradient-text">20+</p>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Open Positions</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-extrabold gradient-text">AI</p>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Match Scoring</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-extrabold gradient-text">24h</p>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Avg Response</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-extrabold gradient-text flex items-center justify-center gap-1">
              <TrendingUp className="h-7 w-7" />100%
            </p>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Free to Apply</p>
          </div>
        </div>
      </section>

      {}
      <footer className="border-t border-border bg-white">
        <div className="max-w-5xl mx-auto px-6 py-8 flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-semibold gradient-text text-sm">jobber</span>
          <div className="flex items-center gap-4">
            <span>For Employers</span>
            <span>Privacy</span>
            <span>Terms</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
