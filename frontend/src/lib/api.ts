import type { Job, Applicant, MatchResult, JobApplication, ApplicationStats } from "@/types/jobs";
import type { Resume } from "@/types/resume";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> ?? {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}


export async function uploadResume(file: File): Promise<Resume> {
  const formData = new FormData();
  formData.append("file", file);

  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/api/v1/resume/upload`, {
    method: "POST",
    body: formData,
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Upload failed");
  }

  const data = await res.json();

  return {
    personalDetails: {
      firstName: data.personal_details.first_name,
      lastName: data.personal_details.last_name,
      email: data.personal_details.email,
      phone: data.personal_details.phone,
      countryCode: data.personal_details.country_code,
      address: data.personal_details.address,
      avatarUrl: data.personal_details.avatar_url,
      jobTitle: data.personal_details.job_title ?? "",
    },
    bio: data.bio,
    experience: data.experience.map((exp: Record<string, unknown>) => ({
      id: exp.id,
      company: exp.company,
      position: exp.position,
      location: exp.location,
      startDate: exp.start_date,
      endDate: exp.end_date,
      isCurrent: exp.is_current,
      highlights: exp.highlights,
    })),
    education: data.education.map((edu: Record<string, unknown>) => ({
      id: edu.id,
      institution: edu.institution,
      degree: edu.degree,
      fieldOfStudy: edu.field_of_study,
      startDate: edu.start_date,
      endDate: edu.end_date,
      gpa: edu.gpa,
      description: edu.description,
    })),
    skills: data.skills,
  };
}


export async function listJobs(params?: {
  status?: string;
  q?: string;
  city?: string;
  employment_type?: string;
  is_remote?: boolean;
  mine?: boolean;
  limit?: number;
}): Promise<Job[]> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set("status", params.status);
  if (params?.q) searchParams.set("q", params.q);
  if (params?.city) searchParams.set("city", params.city);
  if (params?.employment_type) searchParams.set("employment_type", params.employment_type);
  if (params?.is_remote !== undefined) searchParams.set("is_remote", String(params.is_remote));
  if (params?.mine) searchParams.set("mine", "true");
  if (params?.limit) searchParams.set("limit", String(params.limit));
  const qs = searchParams.toString();
  return api(`/api/v1/jobs${qs ? `?${qs}` : ""}`);
}

export async function createJob(payload: {
  recruiter_id?: string;
  title: string;
  description: string;
  requirements?: string;
  location?: string;
  department?: string;
  employment_type?: string;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency?: string;
  skills?: string[];
  benefits?: string[];
  responsibilities?: string[];
  is_remote?: boolean;
  team_size?: number | null;
  max_applicants?: number | null;
}): Promise<Job> {
  return api("/api/v1/jobs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getJob(jobId: string): Promise<Job> {
  return api(`/api/v1/jobs/${jobId}`);
}

export async function updateJob(
  jobId: string,
  payload: Partial<{
    title: string;
    description: string;
    requirements: string;
    location: string;
    status: string;
    department: string;
    employment_type: string;
    salary_min: number | null;
    salary_max: number | null;
    salary_currency: string;
    skills: string[];
    benefits: string[];
    responsibilities: string[];
    is_remote: boolean;
    team_size: number | null;
    max_applicants: number | null;
  }>
): Promise<Job> {
  return api(`/api/v1/jobs/${jobId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteJob(jobId: string): Promise<void> {
  return api(`/api/v1/jobs/${jobId}`, { method: "DELETE" });
}

export async function listJobApplicants(jobId: string): Promise<
  Array<{
    id: string;
    user_id: string;
    candidate_name: string;
    candidate_email: string;
    ai_score: number;
    ai_summary: string;
    status: string;
    applied_at: string;
    resume_snapshot: Record<string, unknown>;
  }>
> {
  return api(`/api/v1/jobs/${jobId}/applicants`);
}


export async function generateJobDescription(
  title: string,
  existingDescription?: string
): Promise<string> {
  const data = await api<{ description: string }>("/api/v1/jobs/generate-description", {
    method: "POST",
    body: JSON.stringify({ title, existing_description: existingDescription ?? "" }),
  });
  return data.description;
}


export async function createUser(payload: {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
}): Promise<{ id: string }> {
  return api("/api/v1/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}


export async function listApplications(params?: {
  status?: string;
  search?: string;
  limit?: number;
}): Promise<JobApplication[]> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set("status", params.status);
  if (params?.search) searchParams.set("search", params.search);
  if (params?.limit) searchParams.set("limit", String(params.limit));
  const qs = searchParams.toString();
  return api(`/api/v1/applications${qs ? `?${qs}` : ""}`);
}

export async function getApplicationStats(): Promise<ApplicationStats> {
  return api("/api/v1/applications/stats");
}

export async function getApplication(applicationId: string): Promise<JobApplication> {
  return api(`/api/v1/applications/${applicationId}`);
}

export async function updateApplicationStatus(
  applicationId: string,
  status: string
): Promise<{ id: string; status: string }> {
  return api(`/api/v1/applications/${applicationId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function applyToJob(
  userId: string,
  payload: { job_id: string; resume_data: Record<string, unknown> }
): Promise<{ id: string; ai_score: number; ai_summary: string }> {
  return api(`/api/v1/users/${userId}/apply`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getUserApplications(userId: string): Promise<
  Array<{ id: string; job_id: string; ai_score: number; ai_summary: string; applied_at: string }>
> {
  return api(`/api/v1/users/${userId}/applications`);
}


export async function scoreApplication(applicationId: string): Promise<MatchResult> {
  return api(`/api/v1/match/score/${applicationId}`, { method: "POST" });
}

export async function getTopCandidates(
  jobId: string,
  limit = 10
): Promise<{ job_id: string; candidates: Array<{ user_id: string; similarity: number }> }> {
  return api(`/api/v1/match/candidates/${jobId}?limit=${limit}`);
}


export interface LocationResult {
  clave: string;
  nombre: string;
  state_clave: string;
  state_nombre: string;
}

export async function searchLocations(
  q: string,
  limit = 20
): Promise<LocationResult[]> {
  const searchParams = new URLSearchParams({ q, limit: String(limit) });
  return api(`/api/v1/locations?${searchParams}`);
}


export async function searchKeywords(
  q: string,
  limit = 10
): Promise<string[]> {
  const searchParams = new URLSearchParams({ q, limit: String(limit) });
  return api(`/api/v1/keywords?${searchParams}`);
}


export interface AuthUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: "candidate" | "recruiter";
  company: string;
  recruiter_id: string | null;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export async function authRegister(data: {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role?: string;
  company?: string;
}): Promise<AuthResponse> {
  return api("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function authLogin(data: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  return api("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function authGoogle(idToken: string, role?: string): Promise<AuthResponse> {
  return api("/api/v1/auth/google", {
    method: "POST",
    body: JSON.stringify({ id_token: idToken, role }),
  });
}

export async function authMe(token: string): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Not authenticated");
  return res.json();
}
