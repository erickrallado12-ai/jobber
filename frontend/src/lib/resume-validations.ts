import { z } from "zod";

export const personalDetailsSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  countryCode: z.string().min(1, "Country code is required"),
  address: z.string().optional().default(""),
  avatarUrl: z.string().optional().default(""),
  jobTitle: z.string().min(1, "Job title is required"),
});

export type PersonalDetailsFormData = z.infer<typeof personalDetailsSchema>;

export const bioSchema = z.object({
  bio: z
    .string()
    .min(10, "Bio must be at least 10 characters")
    .max(500, "Bio must be at most 500 characters"),
});

export type BioFormData = z.infer<typeof bioSchema>;

export const experienceSchema = z.object({
  id: z.string().optional(),
  company: z.string().min(1, "Company is required"),
  position: z.string().min(1, "Position is required"),
  location: z.string().optional().default(""),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional().default(""),
  isCurrent: z.boolean().default(false),
  highlights: z.array(z.string()).default([]),
});

export type ExperienceFormData = z.infer<typeof experienceSchema>;

export const educationSchema = z.object({
  id: z.string().optional(),
  institution: z.string().min(1, "Institution is required"),
  degree: z.string().min(1, "Degree is required"),
  fieldOfStudy: z.string().optional().default(""),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional().default(""),
  gpa: z.number().min(0).max(4).optional().default(0),
  description: z.string().optional().default(""),
});

export type EducationFormData = z.infer<typeof educationSchema>;

export const skillsSchema = z.object({
  skills: z.array(z.string()).min(1, "Add at least one skill"),
});

export type SkillsFormData = z.infer<typeof skillsSchema>;
