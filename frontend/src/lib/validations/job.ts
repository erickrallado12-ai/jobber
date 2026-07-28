import { z } from "zod";

export const jobPostingSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  department: z.string().min(1, "Department is required"),
  location: z.string().min(1, "Location is required"),
  employmentType: z.enum(["full-time", "part-time", "contract", "internship"], {
    required_error: "Select an employment type",
  }),
  salaryMin: z.coerce.number().min(0, "Must be positive").optional(),
  salaryMax: z.coerce.number().min(0, "Must be positive").optional(),
  salaryCurrency: z.string().default("USD"),

  description: z.string().min(20, "Description must be at least 20 characters"),
  responsibilities: z
    .array(z.object({ value: z.string().min(1, "Cannot be empty") }))
    .min(1, "Add at least one responsibility"),
  requirements: z.string().min(10, "Requirements must be at least 10 characters"),

  skills: z.array(z.string()).min(1, "Add at least one skill"),
  benefits: z.array(z.string()).optional().default([]),

  applicationDeadline: z.string().optional(),
  maxApplicants: z.coerce.number().int().positive().optional(),
  isRemote: z.boolean().default(false),
  teamSize: z.coerce.number().int().positive().optional(),
});

export type JobPostingFormData = z.infer<typeof jobPostingSchema>;

export const defaultJobPosting: JobPostingFormData = {
  title: "",
  department: "",
  location: "",
  employmentType: "full-time",
  salaryMin: undefined,
  salaryMax: undefined,
  salaryCurrency: "USD",
  description: "",
  responsibilities: [{ value: "" }],
  requirements: "",
  skills: [],
  benefits: [],
  applicationDeadline: "",
  maxApplicants: undefined,
  isRemote: false,
  teamSize: undefined,
};

export const SECTION_FIELDS: Record<string, string[]> = {
  details: ["title", "department", "location", "employmentType", "salaryMin", "salaryMax"],
  about: ["description", "responsibilities", "requirements"],
  skills: ["skills", "benefits"],
  hiring: ["applicationDeadline", "maxApplicants", "isRemote", "teamSize"],
};
