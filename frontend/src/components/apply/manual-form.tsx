"use client";

import { useState, useCallback, useCallback as useCB } from "react";
import { useScrollSpy } from "@/hooks/use-scroll-spy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CityInput } from "@/components/ui/city-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  FileText,
  Briefcase,
  GraduationCap,
  Wrench,
  Plus,
  Trash2,
  Send,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createUser, applyToJob } from "@/lib/api";


interface ExperienceEntry {
  id: string;
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  highlights: string[];
  highlightInput: string;
}

interface EducationEntry {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  gpa: string;
  description: string;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  countryCode: string;
  phone: string;
  jobTitle: string;
  address: string;
  bio: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: string[];
  skillInput: string;
}

const COUNTRY_CODES = [
  { code: "+1", country: "US", flag: "\u{1F1FA}\u{1F1F8}" },
  { code: "+44", country: "UK", flag: "\u{1F1EC}\u{1F1E7}" },
  { code: "+52", country: "MX", flag: "\u{1F1F2}\u{1F1FD}" },
  { code: "+34", country: "ES", flag: "\u{1F1EA}\u{1F1F8}" },
  { code: "+54", country: "AR", flag: "\u{1F1E6}\u{1F1F7}" },
  { code: "+56", country: "CL", flag: "\u{1F1E8}\u{1F1F1}" },
  { code: "+57", country: "CO", flag: "\u{1F1E8}\u{1F1F4}" },
  { code: "+51", country: "PE", flag: "\u{1F1F5}\u{1F1EA}" },
  { code: "+55", country: "BR", flag: "\u{1F1E7}\u{1F1F7}" },
  { code: "+49", country: "DE", flag: "\u{1F1E9}\u{1F1EA}" },
  { code: "+33", country: "FR", flag: "\u{1F1EB}\u{1F1F7}" },
  { code: "+39", country: "IT", flag: "\u{1F1EE}\u{1F1F9}" },
  { code: "+81", country: "JP", flag: "\u{1F1EF}\u{1F1F5}" },
  { code: "+86", country: "CN", flag: "\u{1F1E8}\u{1F1F3}" },
  { code: "+91", country: "IN", flag: "\u{1F1EE}\u{1F1F3}" },
];


const SECTIONS = [
  { id: "personal", label: "Personal Details", icon: User },
  { id: "bio", label: "Short Bio", icon: FileText },
  { id: "experience", label: "Experience", icon: Briefcase },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "skills", label: "Skills", icon: Wrench },
];

function FormSidebar({
  activeSection,
  onNavigate,
}: {
  activeSection: string;
  onNavigate: (id: string) => void;
}) {
  return (
    <nav className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-3">
        Sections
      </p>
      {SECTIONS.map((s) => {
        const active = activeSection === s.id;
        const Icon = s.icon;
        return (
          <button
            key={s.id}
            onClick={() => onNavigate(s.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left",
              active
                ? "bg-muted text-foreground border border-border"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
            )}
          >
            <Icon className={cn("h-4 w-4 shrink-0", active && "text-foreground")} />
            <span className="flex-1">{s.label}</span>
          </button>
        );
      })}
    </nav>
  );
}


let _counter = 0;
const uid = () => `_${++_counter}_${Date.now()}`;

const defaultExperience = (): ExperienceEntry => ({
  id: uid(),
  company: "",
  position: "",
  location: "",
  startDate: "",
  endDate: "",
  isCurrent: false,
  highlights: [],
  highlightInput: "",
});

const defaultEducation = (): EducationEntry => ({
  id: uid(),
  institution: "",
  degree: "",
  fieldOfStudy: "",
  startDate: "",
  endDate: "",
  gpa: "",
  description: "",
});


function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="h-4.5 w-4.5 text-foreground" />
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

function LabelField({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}


interface Props {
  jobId: string;
  jobTitle: string;
  onBack: () => void;
  authUser?: { id: string } | null;
}

export function ManualApplyForm({ jobId, jobTitle, onBack, authUser }: Props) {
  const [form, setForm] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    countryCode: "+52",
    phone: "",
    jobTitle: "",
    address: "",
    bio: "",
    experience: [defaultExperience()],
    education: [defaultEducation()],
    skills: [],
    skillInput: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const activeSection = useScrollSpy({ sectionSelector: "[data-section]", offset: 120 });

  const scrollToSection = useCallback((id: string) => {
    const el = document.querySelector(`[data-section="${id}"]`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const update = useCallback(
    (patch: Partial<FormData>) => {
      setForm((prev) => ({ ...prev, ...patch }));
      setError(null);
      Object.keys(patch).forEach((k) => setFieldErrors((prev) => { const n = { ...prev }; delete n[k]; return n; }));
    },
    []
  );


  const updateExp = useCallback((id: string, patch: Partial<ExperienceEntry>) => {
    setForm((prev) => ({
      ...prev,
      experience: prev.experience.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));
  }, []);

  const removeExp = useCallback((id: string) => {
    setForm((prev) => ({
      ...prev,
      experience: prev.experience.filter((e) => e.id !== id),
    }));
  }, []);

  const addHighlight = useCallback((expId: string) => {
    setForm((prev) => ({
      ...prev,
      experience: prev.experience.map((e) => {
        if (e.id !== expId || !e.highlightInput.trim()) return e;
        return {
          ...e,
          highlights: [...e.highlights, e.highlightInput.trim()],
          highlightInput: "",
        };
      }),
    }));
  }, []);

  const removeHighlight = useCallback((expId: string, idx: number) => {
    setForm((prev) => ({
      ...prev,
      experience: prev.experience.map((e) => {
        if (e.id !== expId) return e;
        return { ...e, highlights: e.highlights.filter((_, i) => i !== idx) };
      }),
    }));
  }, []);


  const updateEdu = useCallback((id: string, patch: Partial<EducationEntry>) => {
    setForm((prev) => ({
      ...prev,
      education: prev.education.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));
  }, []);

  const removeEdu = useCallback((id: string) => {
    setForm((prev) => ({
      ...prev,
      education: prev.education.filter((e) => e.id !== id),
    }));
  }, []);


  const addSkill = useCallback(() => {
    const s = form.skillInput.trim();
    if (s && !form.skills.includes(s)) {
      update({ skills: [...form.skills, s], skillInput: "" });
    }
  }, [form.skillInput, form.skills, update]);

  const removeSkill = useCallback(
    (s: string) => update({ skills: form.skills.filter((x) => x !== s) }),
    [form.skills, update]
  );


  const handleSubmit = useCallback(async () => {
    const errors: Record<string, string> = {};
    if (!form.firstName.trim()) errors.firstName = "First name is required.";
    if (!form.lastName.trim()) errors.lastName = "Last name is required.";
    if (!form.email.trim()) errors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = "Enter a valid email address.";
    if (!form.phone.trim()) errors.phone = "Phone number is required.";
    if (!form.jobTitle.trim()) errors.jobTitle = "Job title is required.";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Please fix the highlighted fields.");
      scrollToSection("personal");
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    setError(null);
    try {
      let userId: string;
      if (authUser) {
        userId = authUser.id;
        await createUser({
          first_name: form.firstName.trim(),
          last_name: form.lastName.trim(),
          email: form.email.trim(),
          phone: form.phone || undefined,
        });
      } else {
        const user = await createUser({
          first_name: form.firstName.trim(),
          last_name: form.lastName.trim(),
          email: form.email.trim(),
          phone: form.phone || undefined,
        });
        userId = user.id;
      }

      const resumeData = {
        personal_details: {
          first_name: form.firstName.trim(),
          last_name: form.lastName.trim(),
          email: form.email.trim(),
          phone: form.phone,
          country_code: form.countryCode,
          job_title: form.jobTitle,
          address: form.address,
        },
        bio: form.bio,
        experience: form.experience.map((e) => ({
          id: e.id,
          company: e.company,
          position: e.position,
          location: e.location,
          start_date: e.startDate,
          end_date: e.endDate,
          is_current: e.isCurrent,
          highlights: e.highlights,
        })),
        education: form.education.map((e) => ({
          id: e.id,
          institution: e.institution,
          degree: e.degree,
          field_of_study: e.fieldOfStudy,
          start_date: e.startDate,
          end_date: e.endDate,
          gpa: e.gpa,
          description: e.description,
        })),
        skills: form.skills,
      };

      await applyToJob(userId, { job_id: jobId, resume_data: resumeData });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit application.");
    } finally {
      setSubmitting(false);
    }
  }, [form, jobId, scrollToSection, authUser]);

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-muted/20 flex items-center justify-center">
        <div className="max-w-md text-center p-8">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Application Submitted</h1>
          <p className="text-muted-foreground mb-6">
            Your application for <strong>{jobTitle}</strong> has been received.
          </p>
          <Button variant="outline" onClick={onBack}>Back to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-muted/20">
      {}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-sm font-semibold text-foreground">
                {form.firstName || form.lastName
                  ? `${form.firstName} ${form.lastName}`.trim()
                  : "Your Application"}
              </h1>
              <p className="text-xs text-muted-foreground">Applying to {jobTitle}</p>
            </div>
          </div>
          <Button
            size="sm"
            disabled={submitting}
            onClick={handleSubmit}
            className="gap-1.5 bg-foreground hover:bg-foreground/90 text-primary-foreground"
          >
            {submitting ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                Submit Application
              </>
            )}
          </Button>
        </div>
      </div>

      {}
      {error && (
        <div className="max-w-6xl mx-auto px-6 pt-4">
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        </div>
      )}

      {}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex gap-10">
          {}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-[100px]">
              <FormSidebar activeSection={activeSection} onNavigate={scrollToSection} />
            </div>
          </aside>

          {}
          <div className="flex-1 min-w-0 space-y-12 pb-32">
            {}
            <section data-section="personal" className="scroll-mt-[120px]">
              <SectionHeader
                icon={User}
                title="Personal Details"
                description="Your basic contact information"
              />
              <div className="mt-6 space-y-5">
                <FieldGroup>
                  <LabelField label="First Name" required error={fieldErrors.firstName}>
                    <Input
                      value={form.firstName}
                      onChange={(e) => update({ firstName: e.target.value })}
                      placeholder="John"
                      className={fieldErrors.firstName ? "border-destructive focus-visible:ring-destructive" : ""}
                    />
                  </LabelField>
                  <LabelField label="Last Name" required error={fieldErrors.lastName}>
                    <Input
                      value={form.lastName}
                      onChange={(e) => update({ lastName: e.target.value })}
                      placeholder="Doe"
                      className={fieldErrors.lastName ? "border-destructive focus-visible:ring-destructive" : ""}
                    />
                  </LabelField>
                </FieldGroup>
                <FieldGroup>
                  <LabelField label="Email" required error={fieldErrors.email}>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => update({ email: e.target.value })}
                      placeholder="john@example.com"
                      className={fieldErrors.email ? "border-destructive focus-visible:ring-destructive" : ""}
                    />
                  </LabelField>
                </FieldGroup>
                <div className="space-y-2">
                  <Label className="text-sm">
                    Phone<span className="text-destructive ml-0.5">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <Select
                      value={form.countryCode}
                      onValueChange={(val) => update({ countryCode: val })}
                    >
                      <SelectTrigger className={`w-[110px] shrink-0 ${fieldErrors.phone ? "border-destructive focus:ring-destructive" : ""}`}>
                        <SelectValue>
                          {COUNTRY_CODES.find((c) => c.code === form.countryCode)?.flag}{" "}
                          {form.countryCode}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRY_CODES.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.flag} {c.country} ({c.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={form.phone}
                      onChange={(e) => update({ phone: e.target.value })}
                      placeholder="555 123 4567"
                      className={`flex-1 ${fieldErrors.phone ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    />
                  </div>
                  {fieldErrors.phone && <p className="text-xs text-destructive">{fieldErrors.phone}</p>}
                </div>
                <FieldGroup>
                  <LabelField label="Job Title" required error={fieldErrors.jobTitle}>
                    <Input
                      value={form.jobTitle}
                      onChange={(e) => update({ jobTitle: e.target.value })}
                      placeholder="e.g. Senior Frontend Engineer"
                      className={fieldErrors.jobTitle ? "border-destructive focus-visible:ring-destructive" : ""}
                    />
                  </LabelField>
                  <LabelField label="Location">
                    <CityInput
                      value={form.address}
                      onChange={(val) => update({ address: val })}
                      placeholder="e.g. Ciudad de México"
                    />
                  </LabelField>
                </FieldGroup>
              </div>
            </section>

            <hr className="border-border" />

            {}
            <section data-section="bio" className="scroll-mt-[120px]">
              <SectionHeader
                icon={FileText}
                title="Short Bio"
                description="A brief professional summary"
              />
              <div className="mt-6">
                <Textarea
                  value={form.bio}
                  onChange={(e) => update({ bio: e.target.value })}
                  placeholder="Write 2-3 sentences about your professional background and goals..."
                  rows={4}
                  className="resize-y"
                />
              </div>
            </section>

            <hr className="border-border" />

            {}
            <section data-section="experience" className="scroll-mt-[120px]">
              <SectionHeader
                icon={Briefcase}
                title="Work Experience"
                description="Your professional work history"
              />
              <div className="mt-6 space-y-6">
                {form.experience.map((exp, idx) => (
                  <div key={exp.id} className="rounded-lg border border-border bg-white p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">
                        {exp.position || exp.company ? `${exp.position}${exp.company ? ` at ${exp.company}` : ""}` : `Experience ${idx + 1}`}
                      </p>
                      {form.experience.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-red-600"
                          onClick={() => removeExp(exp.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <FieldGroup>
                      <LabelField label="Position">
                        <Input
                          value={exp.position}
                          onChange={(e) => updateExp(exp.id, { position: e.target.value })}
                          placeholder="e.g. Senior Engineer"
                        />
                      </LabelField>
                      <LabelField label="Company">
                        <Input
                          value={exp.company}
                          onChange={(e) => updateExp(exp.id, { company: e.target.value })}
                          placeholder="e.g. Google"
                        />
                      </LabelField>
                    </FieldGroup>
                    <FieldGroup>
                      <LabelField label="Location">
                        <Input
                          value={exp.location}
                          onChange={(e) => updateExp(exp.id, { location: e.target.value })}
                          placeholder="e.g. Mountain View, CA"
                        />
                      </LabelField>
                      <div />
                    </FieldGroup>
                    <FieldGroup>
                      <LabelField label="Start Date">
                        <Input
                          type="month"
                          value={exp.startDate}
                          onChange={(e) => updateExp(exp.id, { startDate: e.target.value })}
                        />
                      </LabelField>
                      <LabelField label="End Date">
                        <Input
                          type="month"
                          value={exp.endDate}
                          disabled={exp.isCurrent}
                          onChange={(e) => updateExp(exp.id, { endDate: e.target.value })}
                        />
                      </LabelField>
                    </FieldGroup>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`current-${exp.id}`}
                        checked={exp.isCurrent}
                        onChange={(e) =>
                          updateExp(exp.id, {
                            isCurrent: e.target.checked,
                            endDate: e.target.checked ? "" : exp.endDate,
                          })
                        }
                        className="h-4 w-4 rounded border-border"
                      />
                      <label htmlFor={`current-${exp.id}`} className="text-sm text-muted-foreground">
                        I currently work here
                      </label>
                    </div>

                    {}
                    <div className="space-y-2">
                      <Label className="text-sm">Highlights</Label>
                      <div className="flex flex-wrap gap-2 min-h-[36px]">
                        {exp.highlights.map((h, i) => (
                          <Badge key={i} variant="secondary" className="gap-1 pr-1">
                            {h}
                            <button
                              type="button"
                              onClick={() => removeHighlight(exp.id, i)}
                              className="ml-1 rounded-full p-0.5 hover:bg-foreground/10"
                            >
                              <span className="sr-only">Remove</span>
                              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          value={exp.highlightInput}
                          onChange={(e) => updateExp(exp.id, { highlightInput: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addHighlight(exp.id);
                            }
                          }}
                          placeholder="e.g. Increased revenue by 40%..."
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addHighlight(exp.id)}
                          disabled={!exp.highlightInput.trim()}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-dashed"
                  onClick={() =>
                    update({ experience: [...form.experience, defaultExperience()] })
                  }
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Experience
                </Button>
              </div>
            </section>

            <hr className="border-border" />

            {}
            <section data-section="education" className="scroll-mt-[120px]">
              <SectionHeader
                icon={GraduationCap}
                title="Education"
                description="Your educational background"
              />
              <div className="mt-6 space-y-6">
                {form.education.map((edu, idx) => (
                  <div key={edu.id} className="rounded-lg border border-border bg-white p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">
                        {edu.institution || edu.degree
                          ? `${edu.degree}${edu.institution ? ` — ${edu.institution}` : ""}`
                          : `Education ${idx + 1}`}
                      </p>
                      {form.education.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-red-600"
                          onClick={() => removeEdu(edu.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <FieldGroup>
                      <LabelField label="Institution">
                        <Input
                          value={edu.institution}
                          onChange={(e) => updateEdu(edu.id, { institution: e.target.value })}
                          placeholder="e.g. Stanford University"
                        />
                      </LabelField>
                      <LabelField label="Degree">
                        <Input
                          value={edu.degree}
                          onChange={(e) => updateEdu(edu.id, { degree: e.target.value })}
                          placeholder="e.g. Bachelor of Science"
                        />
                      </LabelField>
                    </FieldGroup>
                    <FieldGroup>
                      <LabelField label="Field of Study">
                        <Input
                          value={edu.fieldOfStudy}
                          onChange={(e) => updateEdu(edu.id, { fieldOfStudy: e.target.value })}
                          placeholder="e.g. Computer Science"
                        />
                      </LabelField>
                      <LabelField label="GPA">
                        <Input
                          value={edu.gpa}
                          onChange={(e) => updateEdu(edu.id, { gpa: e.target.value })}
                          placeholder="e.g. 3.8"
                        />
                      </LabelField>
                    </FieldGroup>
                    <FieldGroup>
                      <LabelField label="Start Date">
                        <Input
                          type="month"
                          value={edu.startDate}
                          onChange={(e) => updateEdu(edu.id, { startDate: e.target.value })}
                        />
                      </LabelField>
                      <LabelField label="End Date">
                        <Input
                          type="month"
                          value={edu.endDate}
                          onChange={(e) => updateEdu(edu.id, { endDate: e.target.value })}
                        />
                      </LabelField>
                    </FieldGroup>
                    <div className="space-y-2">
                      <Label className="text-sm">Description</Label>
                      <Textarea
                        value={edu.description}
                        onChange={(e) => updateEdu(edu.id, { description: e.target.value })}
                        placeholder="Activities, achievements, relevant coursework..."
                        rows={2}
                        className="resize-y"
                      />
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-dashed"
                  onClick={() => update({ education: [...form.education, defaultEducation()] })}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Education
                </Button>
              </div>
            </section>

            <hr className="border-border" />

            {}
            <section data-section="skills" className="scroll-mt-[120px]">
              <SectionHeader
                icon={Wrench}
                title="Skills"
                description="Highlight your key abilities"
              />
              <div className="mt-6 space-y-4">
                <div className="flex flex-wrap gap-2 min-h-[48px] rounded-lg border border-border/60 bg-white p-4">
                  {form.skills.length === 0 && (
                    <p className="text-sm text-muted-foreground">No skills added yet.</p>
                  )}
                  {form.skills.map((s) => (
                    <Badge key={s} variant="secondary" className="gap-1 pr-1">
                      {s}
                      <button
                        type="button"
                        onClick={() => removeSkill(s)}
                        className="ml-1 rounded-full p-0.5 hover:bg-foreground/10"
                      >
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={form.skillInput}
                    onChange={(e) => update({ skillInput: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSkill();
                      }
                    }}
                    placeholder="Type a skill and press Enter..."
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addSkill}
                    disabled={!form.skillInput.trim()}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
