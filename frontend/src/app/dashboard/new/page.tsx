"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  Send,
  Loader2,
  MapPin,
  Building2,
  Clock,
  DollarSign,
  Users,
  Calendar,
  Globe,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { CityInput } from "@/components/ui/city-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useScrollSpy } from "@/hooks/use-scroll-spy";
import { useAutoSave } from "@/hooks/use-auto-save";
import { jobPostingSchema, defaultJobPosting, type JobPostingFormData } from "@/lib/validations/job";
import { FormSidebar } from "@/components/jobs/form-sidebar";
import { RichTextEditor } from "@/components/jobs/rich-text-editor";
import { ResponsibilityArray } from "@/components/jobs/responsibility-array";
import { TagInput } from "@/components/jobs/tag-input";
import { PreviewSheet } from "@/components/jobs/preview-sheet";
import { createJob } from "@/lib/api";

const AUTO_SAVE_KEY = "cv-builder-job-draft";

export default function NewJobPage() {
  const router = useRouter();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    reset,
    formState: { errors, isDirty },
  } = useForm<JobPostingFormData>({
    resolver: zodResolver(jobPostingSchema),
    defaultValues: defaultJobPosting,
  });

  const formValues = watch();

  const { load, clear } = useAutoSave({
    key: AUTO_SAVE_KEY,
    data: formValues,
    delay: 1500,
  });

  useEffect(() => {
    const saved = load();
    if (saved) reset(saved);
  }, []);

  const activeSection = useScrollSpy({ sectionSelector: "[data-section]", offset: 140 });

  const scrollToSection = useCallback((sectionId: string) => {
    const el = document.querySelector(`[data-section="${sectionId}"]`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const onSubmit = useCallback(
    async (data: JobPostingFormData) => {
      setPublishing(true);
      try {
        const responsibilities = data.responsibilities.map((r) => r.value).filter(Boolean);
        const payload = {
          title: data.title,
          description: data.description,
          requirements: data.requirements,
          location: data.location,
          department: data.department,
          employment_type: data.employmentType,
          salary_min: data.salaryMin ?? null,
          salary_max: data.salaryMax ?? null,
          salary_currency: data.salaryCurrency,
          skills: data.skills,
          benefits: data.benefits,
          responsibilities,
          is_remote: data.isRemote,
          team_size: data.teamSize ?? null,
          max_applicants: data.maxApplicants ?? null,
        };
        await createJob(payload);
        clear();
        router.push("/dashboard");
      } catch {
        setPublishing(false);
      }
    },
    [clear, router]
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/50 to-white">
      <div className="sticky top-[64px] z-40 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")} className="hover:bg-teal-50 hover:text-teal-700">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-sm font-semibold text-foreground">
                {formValues.title || "New Job Posting"}
              </h1>
              <p className="text-xs text-muted-foreground">
                {isDirty ? "Unsaved changes" : "No changes yet"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setPreviewOpen(true)} className="gap-1.5 border-teal-200 text-teal-700 hover:bg-teal-50">
              <Eye className="h-3.5 w-3.5" /> Preview
            </Button>
            <Button type="submit" size="sm" disabled={publishing} onClick={handleSubmit(onSubmit)} className="gap-1.5 btn-primary">
              {publishing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              {publishing ? "Publishing..." : "Publish"}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex gap-10">
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-[140px]">
              <FormSidebar activeSection={activeSection} errors={errors} onNavigate={scrollToSection} />
            </div>
          </aside>

          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 min-w-0 space-y-12">
            <section data-section="details" className="scroll-mt-[140px]">
              <SectionHeader icon={Building2} title="Job Details" description="Basic information about this position" />
              <div className="mt-6 space-y-5">
                <FieldGroup>
                  <LabelField label="Job Title" error={errors.title?.message} required>
                    <Input {...register("title")} placeholder="e.g. Senior Frontend Engineer" />
                  </LabelField>
                  <LabelField label="Department" error={errors.department?.message} required>
                    <Input {...register("department")} placeholder="e.g. Engineering" />
                  </LabelField>
                </FieldGroup>
                <FieldGroup>
                  <LabelField label="Location" error={errors.location?.message} required>
                    <CityInput
                      value={formValues.location}
                      onChange={(val) => setValue("location", val, { shouldDirty: true })}
                      placeholder="e.g. Ciudad de México"
                    />
                  </LabelField>
                  <LabelField label="Employment Type" error={errors.employmentType?.message} required>
                    <Select value={formValues.employmentType} onValueChange={(v) => setValue("employmentType", v as JobPostingFormData["employmentType"], { shouldDirty: true })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full-time">Full-time</SelectItem>
                        <SelectItem value="part-time">Part-time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="internship">Internship</SelectItem>
                      </SelectContent>
                    </Select>
                  </LabelField>
                </FieldGroup>
                <FieldGroup>
                  <LabelField label="Salary Range (Annual)" error={errors.salaryMin?.message || errors.salaryMax?.message}>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input {...register("salaryMin")} type="number" placeholder="Min" className="pl-9" />
                      </div>
                      <span className="text-muted-foreground">–</span>
                      <div className="relative flex-1">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input {...register("salaryMax")} type="number" placeholder="Max" className="pl-9" />
                      </div>
                    </div>
                  </LabelField>
                </FieldGroup>
              </div>
            </section>

            <hr className="border-gray-200" />

            <section data-section="about" className="scroll-mt-[140px]">
              <SectionHeader icon={Clock} title="About the Job" description="Describe the role, responsibilities, and requirements" />
              <div className="mt-6 space-y-8">
                <RichTextEditor value={formValues.description} onChange={(v) => setValue("description", v, { shouldDirty: true })} jobTitle={formValues.title} error={errors.description?.message} />
                <ResponsibilityArray control={control} errors={errors} />
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Requirements</Label>
                  <Textarea {...register("requirements")} placeholder="List the must-have qualifications, experience, and education..." rows={6} className="resize-y" />
                  {errors.requirements?.message && <p className="text-sm text-destructive">{errors.requirements.message}</p>}
                </div>
              </div>
            </section>

            <hr className="border-gray-200" />

            <section data-section="skills" className="scroll-mt-[140px]">
              <SectionHeader icon={Globe} title="Skills & Benefits" description="Required skills and perks for this role" />
              <div className="mt-6 space-y-6">
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Required Skills</Label>
                  <TagInput value={formValues.skills} onChange={(v) => setValue("skills", v, { shouldDirty: true })} placeholder="Type a skill and press Enter..." />
                  {errors.skills?.message && <p className="text-sm text-destructive">{errors.skills.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Benefits & Perks</Label>
                  <TagInput value={formValues.benefits} onChange={(v) => setValue("benefits", v, { shouldDirty: true })} placeholder="e.g. Health Insurance, 401k, Remote Flexibility..." />
                </div>
              </div>
            </section>

            <hr className="border-gray-200" />

            <section data-section="hiring" className="scroll-mt-[140px]">
              <SectionHeader icon={Users} title="Hiring Stage" description="Configure application limits and remote policy" />
              <div className="mt-6 space-y-5">
                <FieldGroup>
                  <LabelField label="Application Deadline">
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input {...register("applicationDeadline")} type="date" className="pl-9" />
                    </div>
                  </LabelField>
                  <LabelField label="Max Applicants">
                    <Input {...register("maxApplicants")} type="number" placeholder="No limit" />
                  </LabelField>
                </FieldGroup>
                <FieldGroup>
                  <LabelField label="Team Size">
                    <Input {...register("teamSize")} type="number" placeholder="e.g. 8" />
                  </LabelField>
                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Remote Friendly</Label>
                      <p className="text-xs text-muted-foreground">Allow candidates from anywhere</p>
                    </div>
                    <Switch checked={formValues.isRemote} onCheckedChange={(v) => setValue("isRemote", v, { shouldDirty: true })} />
                  </div>
                </FieldGroup>
              </div>
            </section>

            <div className="h-32" />
          </form>
        </div>
      </div>

      <PreviewSheet open={previewOpen} onOpenChange={setPreviewOpen} data={formValues} />
    </div>
  );
}

function SectionHeader({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-9 w-9 rounded-lg bg-teal-100 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="h-4.5 w-4.5 text-teal-600" />
      </div>
      <div>
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
  );
}

function FieldGroup({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">{children}</div>;
}

function LabelField({ label, error, required, children }: { label: string; error?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
