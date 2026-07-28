export interface Job {
  id: string;
  recruiter_id: string;
  title: string;
  description: string;
  requirements: string;
  location: string;
  status: "open" | "closed";
  created_at: string;
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
}

export interface Recruiter {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  company: string;
}

export interface Applicant {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  application_id: string;
  ai_score: number;
  ai_summary: string;
  applied_at: string;
  resume_data: Record<string, unknown>;
}

export interface MatchResult {
  application_id: string;
  score: number;
  summary: string;
  strengths: string[];
  gaps: string[];
}

export interface JobApplication {
  id: string;
  job_id: string;
  candidate_name: string;
  candidate_email: string;
  job_title: string;
  job_location: string;
  job_employment_type: string;
  job_salary_min: number | null;
  job_salary_max: number | null;
  job_salary_currency: string;
  job_skills: string[];
  job_is_remote: boolean;
  job_department: string;
  ai_score: number;
  ai_summary: string;
  ai_strengths?: string[];
  ai_gaps?: string[];
  status: "pending" | "reviewing" | "shortlisted" | "interviewing" | "offered" | "rejected" | "withdrawn";
  applied_at: string;
  resume_data: Record<string, unknown>;
}

export interface ApplicationStats {
  total: number;
  pending: number;
  reviewing: number;
  shortlisted: number;
  interviewing: number;
  offered: number;
  rejected: number;
  withdrawn: number;
}
