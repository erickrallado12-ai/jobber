"use client";

import Link from "next/link";
import type { Job } from "@/types/jobs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Plus, Briefcase } from "lucide-react";

interface JobListProps {
  jobs: Job[];
  loading: boolean;
  baseUrl?: string;
}

export function JobList({ jobs, loading, baseUrl = "/jobs" }: JobListProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-teal-500" />
            Job Listings
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your open positions and review applicants.
          </p>
        </div>
        <Button asChild className="btn-primary">
          <Link href="/dashboard/new">
            <Plus className="h-4 w-4 mr-2" />
            New Job
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <div className="flex items-center gap-3">
            <svg className="animate-spin h-5 w-5 text-teal-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Loading jobs...
          </div>
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 bg-gray-50/50 rounded-xl border border-dashed border-teal-200">
          <Briefcase className="h-12 w-12 text-teal-200 mx-auto mb-4" />
          <p className="text-muted-foreground">No jobs posted yet.</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Click &quot;New Job&quot; to create your first listing.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <Link
              key={job.id}
              href={`${baseUrl}/${job.id}`}
              className="block w-full text-left p-5 rounded-xl border border-gray-200 bg-white hover:border-gray-300 hover:shadow-md hover:shadow-gray-500/5 transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-sm shadow-teal-500/20">
                    {job.title.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground group-hover:text-teal-700 transition-colors truncate">
                      {job.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {job.description}
                    </p>
                    <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                      {job.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-teal-400" />
                          {job.location}
                        </span>
                      )}
                      <span>
                        {new Date(job.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <Badge className={job.status === "open" ? "bg-emerald-100 text-emerald-700 border-emerald-200 shrink-0" : "bg-zinc-100 text-zinc-700 border-zinc-200 shrink-0"}>
                  {job.status}
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
