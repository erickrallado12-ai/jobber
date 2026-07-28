"use client";

import { useFieldArray, type Control, type FieldErrors } from "react-hook-form";
import { Plus, GripVertical, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { JobPostingFormData } from "@/lib/validations/job";

interface ResponsibilityArrayProps {
  control: Control<JobPostingFormData>;
  errors: FieldErrors<JobPostingFormData>;
}

export function ResponsibilityArray({ control, errors }: ResponsibilityArrayProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "responsibilities",
  });

  const responsibilityErrors = errors.responsibilities;

  return (
    <div className="space-y-3">
      <Label className="text-base font-semibold">Key Responsibilities</Label>
      <div className="space-y-3">
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-start gap-2 group">
            <div className="flex items-center pt-2.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors">
              <GripVertical className="h-4 w-4" />
            </div>
            <Textarea
              {...control.register(`responsibilities.${index}.value`)}
              placeholder={`Responsibility ${index + 1}...`}
              rows={2}
              className={cn(
                "resize-none",
                responsibilityErrors?.[index]?.value && "border-destructive focus-visible:ring-destructive"
              )}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => remove(index)}
              disabled={fields.length <= 1}
              className="shrink-0 mt-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append({ value: "" })}
        className="gap-1.5"
      >
        <Plus className="h-4 w-4" />
        Add Responsibility
      </Button>
      {responsibilityErrors?.message && (
        <p className="text-sm text-destructive">{responsibilityErrors.message}</p>
      )}
    </div>
  );
}
