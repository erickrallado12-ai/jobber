"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Job } from "@/types/jobs";
import type { Resume } from "@/types/resume";
import { getJob, uploadResume, createUser, applyToJob } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { UploadZone } from "@/components/resume/upload-zone";
import { PdfViewer } from "@/components/resume/pdf-viewer";
import { ResumeStepper } from "@/components/resume/resume-stepper";
import { ProcessingSkeleton } from "@/components/resume/processing-skeleton";
import { ManualApplyForm } from "@/components/apply/manual-form";
import { defaultResume } from "@/types/resume";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type ApplyView = "choose" | "upload" | "upload-processing" | "upload-editor" | "manual" | "success";

export default function ApplyPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const router = useRouter();
  const { user: authUser } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [jobLoading, setJobLoading] = useState(true);

  const [view, setView] = useState<ApplyView>("choose");
  const [resume, setResume] = useState<Resume>(defaultResume);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getJob(jobId)
      .then(setJob)
      .catch(() => setJob(null))
      .finally(() => setJobLoading(false));
  }, [jobId]);


  const handleFileSelect = useCallback(async (file: File) => {
    const url = URL.createObjectURL(file);
    setFileUrl(url);
    setView("upload-processing");
    setError(null);

    try {
      const parsed = await uploadResume(file);
      setResume(parsed);
      setView("upload-editor");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process resume");
      setView("choose");
    }
  }, []);

  const handleSubmitFromUpload = useCallback(async () => {
    const pd = resume.personalDetails;
    if (!pd.firstName.trim() || !pd.lastName.trim() || !pd.email.trim()) {
      setError("First name, last name, and email are required. Go back to the first step and fill them in.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pd.email.trim())) {
      setError("Please enter a valid email address. Go back to the first step and fix it.");
      return;
    }
    if (!pd.jobTitle) {
      setError("Job title is required. Go back to the first step and select one.");
      return;
    }
    if (!pd.countryCode || !pd.phone.trim()) {
      setError("Phone number and country code are required. Go back to the first step and fill them in.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (authUser) {
        await createUser({
          first_name: pd.firstName.trim(),
          last_name: pd.lastName.trim(),
          email: pd.email.trim(),
          phone: pd.phone || undefined,
        });
        await applyToJob(authUser.id, {
          job_id: jobId,
          resume_data: resume as unknown as Record<string, unknown>,
        });
      } else {
        const user = await createUser({
          first_name: pd.firstName.trim(),
          last_name: pd.lastName.trim(),
          email: pd.email.trim(),
          phone: pd.phone || undefined,
        });
        await applyToJob(user.id, {
          job_id: jobId,
          resume_data: resume as unknown as Record<string, unknown>,
        });
      }
      setView("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [resume, jobId, authUser]);


  if (jobLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50/50 to-white flex items-center justify-center">
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
      <div className="min-h-screen bg-gradient-to-b from-gray-50/50 to-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Job not found or no longer available.</p>
          <Button variant="outline" onClick={() => router.push("/")}>Back to Home</Button>
        </div>
      </div>
    );
  }


  if (view === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50/50 to-white flex items-center justify-center">
        <div className="max-w-md text-center p-8">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Application Submitted</h1>
          <p className="text-muted-foreground mb-6">
            Your application for <strong>{job.title}</strong> has been received. The recruiter will review your profile and get back to you.
          </p>
          <Button variant="outline" onClick={() => router.push("/")}>Back to Home</Button>
        </div>
      </div>
    );
  }


  if (view === "manual") {
    return (
      <ManualApplyForm
        jobId={jobId}
        jobTitle={job.title}
        onBack={() => router.push("/")}
        authUser={authUser}
      />
    );
  }


  if (view === "upload-processing" || view === "upload-editor") {
    return (
      <div className="flex-1 flex flex-col h-screen">
        {error && (
          <div className="px-6 py-3 bg-red-50 border-b border-red-200 text-sm text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 font-medium">
              Dismiss
            </button>
          </div>
        )}
        {view === "upload-processing" && <ProcessingSkeleton fileUrl={fileUrl} />}
        {view === "upload-editor" && (
          <div className="flex-1 flex overflow-hidden">
            <div className="w-full lg:w-[45%] flex flex-col bg-white border-r border-gray-200 overflow-hidden">
              <ResumeStepper
                resume={resume}
                onUpdate={setResume}
                onSubmit={handleSubmitFromUpload}
                isSubmitting={submitting}
                submitLabel="Submit Application"
              />
            </div>
            <div className="hidden lg:flex w-full lg:w-[55%] bg-slate-50 items-center justify-center p-8">
              <PdfViewer fileUrl={fileUrl} />
            </div>
          </div>
        )}
      </div>
    );
  }


  if (view === "upload") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50/50 to-white">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="mb-8">
            <Badge variant="secondary" className="mb-3 text-xs">Open Position</Badge>
            <h1 className="text-3xl font-bold text-foreground">{job.title}</h1>
            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
              {job.location && <span>{job.location}</span>}
              <span className="capitalize">{job.employment_type}</span>
              {job.is_remote && <span>Remote</span>}
            </div>
            <p className="text-sm text-muted-foreground mt-3 max-w-2xl line-clamp-3">{job.description}</p>
          </div>

          <div className="w-full max-w-xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-muted text-foreground rounded-full px-4 py-1.5 text-sm font-medium mb-6">
                <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
                Apply with your resume
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Upload your resume to apply
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Our AI will extract your details so you can review and submit your application.
              </p>
            </div>
            <UploadZone onFileSelect={handleFileSelect} isProcessing={false} />
            <button
              onClick={() => setView("choose")}
              className="mt-6 text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
            >
              Back to options
            </button>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/50 to-white">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {}
        <div className="mb-8">
          <Badge variant="secondary" className="mb-3 text-xs">Open Position</Badge>
          <h1 className="text-3xl font-bold text-foreground">{job.title}</h1>
          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
            {job.location && <span>{job.location}</span>}
            <span className="capitalize">{job.employment_type}</span>
            {job.is_remote && <span>Remote</span>}
            {(job.salary_min || job.salary_max) && (
              <span>
                {job.salary_min && job.salary_max
                  ? `${job.salary_currency} ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}`
                  : job.salary_min
                    ? `From ${job.salary_currency} ${job.salary_min.toLocaleString()}`
                    : `Up to ${job.salary_currency} ${job.salary_max!.toLocaleString()}`}
              </span>
            )}
          </div>
        </div>

        {}
        <div className="grid grid-cols-3 gap-8 mb-10">
          <div className="col-span-2 space-y-4">
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="text-sm font-semibold text-foreground mb-3">About the Role</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed line-clamp-6">{job.description}</p>
            </div>
            {job.skills.length > 0 && (
              <div className="rounded-lg border border-gray-200 bg-white p-6">
                <h2 className="text-sm font-semibold text-foreground mb-3">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((s) => (
                    <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div />
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        {}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-foreground text-center mb-2">How would you like to apply?</h2>
          <p className="text-sm text-muted-foreground text-center mb-8">
            Choose the method that works best for you.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => setView("upload")}
              className="relative p-6 rounded-xl border border-gray-200 bg-white hover:border-foreground/30 hover:shadow-md transition-all text-left group"
            >
              <div className="w-12 h-12 rounded-xl bg-foreground flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-foreground mb-1">Upload Resume</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Drop your PDF and our AI will extract your details. Review and submit.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-foreground/40" />
                PDF only, processed with AI
              </div>
            </button>

            <button
              onClick={() => setView("manual")}
              className="p-6 rounded-xl border border-gray-200 bg-white hover:border-foreground/30 hover:shadow-md transition-all text-left group"
            >
              <div className="w-12 h-12 rounded-xl bg-muted-foreground flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-foreground mb-1">Fill Manually</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Enter your details by hand. Full control over what you share.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-foreground/40" />
                No resume needed
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
