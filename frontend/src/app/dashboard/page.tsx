"use client";

import { useState, useEffect, useCallback } from "react";
import type { Job } from "@/types/jobs";
import { listJobs } from "@/lib/api";
import { JobList } from "@/components/recruiter/job-list";

export default function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listJobs({ mine: true });
      setJobs(data);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-gray-50/50 to-white">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <JobList jobs={jobs} loading={loading} baseUrl="/dashboard" />
      </div>
    </div>
  );
}
