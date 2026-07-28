"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { bioSchema, type BioFormData } from "@/lib/resume-validations";

interface Props {
  data: string;
  onSave: (bio: string) => void;
}

export function ShortBioStep({ data, onSave }: Props) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
  } = useForm<BioFormData>({
    resolver: zodResolver(bioSchema),
    defaultValues: { bio: data },
  });

  useEffect(() => {
    reset({ bio: data });
  }, [data, reset]);

  const bioValue = watch("bio");

  const onSubmit = (formData: BioFormData) => {
    onSave(formData.bio);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="bio">Professional Summary</Label>
        <Textarea
          id="bio"
          placeholder="Write a short professional summary highlighting your key strengths and career objectives..."
          className="min-h-[200px] resize-none"
          {...register("bio")}
        />
        <p className="text-sm text-muted-foreground text-right">
          {bioValue?.length ?? 0} / 500
        </p>
      </div>
    </form>
  );
}
