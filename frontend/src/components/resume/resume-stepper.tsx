"use client";

import { useRef, useState } from "react";
import { User, FileText, Briefcase, GraduationCap, Wrench, ChevronRight, ChevronLeft, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PersonalDetailsStep, type PersonalDetailsStepHandle } from "./steps/personal-details";
import { ShortBioStep } from "./steps/short-bio";
import { ExperienceStep } from "./steps/experience";
import { EducationStep } from "./steps/education";
import { SkillsStep } from "./steps/skills";
import type { Resume } from "@/types/resume";

interface Props {
  resume: Resume;
  onUpdate: (resume: Resume) => void;
  onSubmit?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

const STEPS = [
  { label: "Your Details", icon: User },
  { label: "Short Bio", icon: FileText },
  { label: "Experience", icon: Briefcase },
  { label: "Education", icon: GraduationCap },
  { label: "Skills", icon: Wrench },
];

export function ResumeStepper({ resume, onUpdate, onSubmit, isSubmitting, submitLabel }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const personalDetailsRef = useRef<PersonalDetailsStepHandle>(null);

  const goTo = (idx: number) => {
    if (idx >= 0 && idx < STEPS.length) setCurrentStep(idx);
  };

  const handleBack = () => goTo(currentStep - 1);

  const handleSaveAndNext = () => {
    if (currentStep === 0) {
      personalDetailsRef.current?.triggerSubmit();
      return;
    }
    goTo(currentStep + 1);
  };

  const isLastStep = currentStep === STEPS.length - 1;
  const showSubmit = isLastStep && onSubmit;

  const stepTitles = [
    { title: "Your CV heading", subtitle: "Let's start with your personal details" },
    { title: "Short Bio", subtitle: "Write a brief professional summary" },
    { title: "Work Experience", subtitle: "Add your work history" },
    { title: "Education", subtitle: "Add your educational background" },
    { title: "Skills", subtitle: "Highlight your key skills" },
  ];

  const current = stepTitles[currentStep];

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="px-6 pt-5 pb-3 shrink-0">
        <div className="flex items-center gap-0 mb-6">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isActive = idx === currentStep;
            const isCompleted = idx < currentStep;

            return (
              <div key={step.label} className="flex items-center flex-1 last:flex-none">
                <button
                  onClick={() => goTo(idx)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 transition-all group shrink-0"
                  )}
                >
                  <div
                    className={cn(
                      "relative flex h-10 w-10 items-center justify-center rounded-lg border-2 transition-all",
                      isActive && "border-foreground bg-foreground text-primary-foreground",
                      isCompleted && "border-foreground bg-foreground text-primary-foreground",
                      !isActive && !isCompleted && "border-muted-foreground/20 text-muted-foreground group-hover:border-muted-foreground/40"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span
                    className={cn(
                      "text-[11px] font-medium whitespace-nowrap transition-colors",
                      isActive && "text-foreground",
                      isCompleted && "text-foreground",
                      !isActive && !isCompleted && "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </span>
                </button>

                {idx < STEPS.length - 1 && (
                  <div className="flex-1 flex items-center mx-1 mb-5">
                    <div
                      className={cn(
                        "h-[2px] w-full transition-colors",
                        idx < currentStep ? "bg-foreground" : "bg-muted-foreground/20"
                      )}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div>
          <h2 className="text-xl font-bold text-foreground">{current.title}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{current.subtitle}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {currentStep === 0 && (
          <PersonalDetailsStep
            ref={personalDetailsRef}
            data={resume.personalDetails}
            onSave={(pd) => {
              onUpdate({ ...resume, personalDetails: pd });
              goTo(1);
            }}
          />
        )}
        {currentStep === 1 && (
          <ShortBioStep
            data={resume.bio}
            onSave={(bio) => {
              onUpdate({ ...resume, bio });
              goTo(2);
            }}
          />
        )}
        {currentStep === 2 && (
          <ExperienceStep
            data={resume.experience}
            onSave={(exp) => {
              onUpdate({ ...resume, experience: exp });
              goTo(3);
            }}
          />
        )}
        {currentStep === 3 && (
          <EducationStep
            data={resume.education}
            onSave={(edu) => {
              onUpdate({ ...resume, education: edu });
              goTo(4);
            }}
          />
        )}
        {currentStep === 4 && (
          <SkillsStep
            data={resume.skills}
            onSave={(skills) => onUpdate({ ...resume, skills })}
          />
        )}
      </div>

      <div className="shrink-0 border-t border-border bg-white px-6 py-3 flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0}
          className="border-muted-foreground/25 text-foreground"
        >
          <ChevronLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        {showSubmit ? (
          <Button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="bg-foreground hover:bg-foreground/90 text-primary-foreground font-medium gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                {submitLabel ?? "Submit Application"}
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={handleSaveAndNext}
            disabled={isLastStep}
            className="bg-foreground hover:bg-foreground/90 text-primary-foreground font-medium"
          >
            Save & Next <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
