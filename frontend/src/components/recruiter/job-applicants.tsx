"use client";

import { useState, useEffect, useCallback } from "react";
import type { Job, Applicant } from "@/types/jobs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getTopCandidates, scoreApplication } from "@/lib/api";

interface JobApplicantsProps {
  job: Job;
  onBack: () => void;
}

interface CandidateRow extends Applicant {
  similarity?: number;
}

export function JobApplicants({ job, onBack }: JobApplicantsProps) {
  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [scoringId, setScoringId] = useState<string | null>(null);

  const loadCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTopCandidates(job.id, 20);
      const rows: CandidateRow[] = data.candidates.map((c) => ({
        user_id: c.user_id,
        first_name: "",
        last_name: "",
        email: "",
        application_id: "",
        ai_score: 0,
        ai_summary: "",
        applied_at: "",
        resume_data: {},
        similarity: c.similarity,
      }));
      setCandidates(rows);
    } catch {
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  }, [job.id]);

  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  async function handleScore(applicationId: string) {
    setScoringId(applicationId);
    try {
      const result = await scoreApplication(applicationId);
      setCandidates((prev) =>
        prev.map((c) =>
          c.application_id === applicationId
            ? { ...c, ai_score: result.score, ai_summary: result.summary }
            : c
        )
      );
    } catch {
    } finally {
      setScoringId(null);
    }
  }

  function scoreColor(score: number) {
    if (score >= 80) return "text-emerald-600 bg-emerald-50";
    if (score >= 60) return "text-coral-600 bg-coral-50";
    if (score > 0) return "text-red-600 bg-red-50";
    return "text-muted-foreground bg-muted/50";
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </Button>
        <div className="min-w-0">
          <h2 className="text-2xl font-bold text-foreground truncate">{job.title}</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Applicants &amp; AI Scoring</p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-white overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{candidates.length} candidate{candidates.length !== 1 ? "s" : ""}</span>
            {job.location && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                {job.location}
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <div className="flex items-center gap-3">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Finding candidates...
            </div>
          </div>
        ) : candidates.length === 0 ? (
          <div className="text-center py-16">
            <svg className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            <p className="text-muted-foreground">No candidates found for this position.</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Candidates will appear here once they apply.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {candidates.map((c) => (
              <div key={c.user_id} className="p-4 hover:bg-muted/10 transition-colors">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs font-medium shrink-0">
                        {c.first_name ? c.first_name[0] : "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {c.first_name || c.last_name
                            ? `${c.first_name} ${c.last_name}`.trim()
                            : `Candidate ${c.user_id.slice(0, 8)}`}
                        </p>
                        {c.email && (
                          <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                        )}
                      </div>
                    </div>
                    {c.ai_summary && (
                      <p className="text-sm text-muted-foreground mt-2 ml-12 line-clamp-2">
                        {c.ai_summary}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {c.similarity !== undefined && (
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Semantic Match</p>
                        <p className="text-sm font-semibold text-foreground">
                          {(c.similarity * 100).toFixed(1)}%
                        </p>
                      </div>
                    )}
                    {c.ai_score > 0 ? (
                      <div className={`px-3 py-1.5 rounded-lg text-sm font-bold ${scoreColor(c.ai_score)}`}>
                        {c.ai_score}
                      </div>
                    ) : c.application_id ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={scoringId === c.application_id}
                        onClick={() => handleScore(c.application_id)}
                        className="text-xs"
                      >
                        {scoringId === c.application_id ? (
                          <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                          </svg>
                        ) : (
                          "Score"
                        )}
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
