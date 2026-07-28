"use client";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { Camera } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  personalDetailsSchema,
  type PersonalDetailsFormData,
} from "@/lib/resume-validations";
import type { PersonalDetails } from "@/types/resume";

interface Props {
  data: PersonalDetails;
  onSave: (data: PersonalDetails) => void;
}

export interface PersonalDetailsStepHandle {
  triggerSubmit: () => void;
}

const JOB_TITLES = [
  "Software Engineer",
  "Senior Software Engineer",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "DevOps Engineer",
  "Data Scientist",
  "Machine Learning Engineer",
  "Product Manager",
  "Project Manager",
  "UX Designer",
  "UI Designer",
  "Business Analyst",
  "Marketing Manager",
  "Sales Representative",
  "Account Executive",
  "Financial Analyst",
  "Operations Manager",
  "Human Resources Manager",
  "CEO",
  "CTO",
  "COO",
  "Director of Engineering",
  "VP of Product",
  "Consultant",
];

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

export const PersonalDetailsStep = forwardRef<PersonalDetailsStepHandle, Props>(
  function PersonalDetailsStep({ data, onSave }, ref) {
    const [avatarPreview, setAvatarPreview] = useState(data.avatarUrl);

    const {
      register,
      handleSubmit,
      watch,
      setValue,
      reset,
      formState: { errors },
    } = useForm<PersonalDetailsFormData>({
      resolver: zodResolver(personalDetailsSchema),
      defaultValues: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        countryCode: data.countryCode,
        address: data.address,
        avatarUrl: data.avatarUrl,
        jobTitle: data.jobTitle,
      },
    });

    useImperativeHandle(ref, () => ({
      triggerSubmit: () => {
        handleSubmit(onSubmit)();
      },
    }));

  useEffect(() => {
    reset({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      countryCode: data.countryCode,
      address: data.address,
      avatarUrl: data.avatarUrl,
      jobTitle: data.jobTitle,
    });
    setAvatarPreview(data.avatarUrl);
  }, [data, reset]);

  const firstName = watch("firstName");
  const lastName = watch("lastName");

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const url = reader.result as string;
        setAvatarPreview(url);
        setValue("avatarUrl", url);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (formData: PersonalDetailsFormData) => {
    onSave({
      ...formData,
      avatarUrl: avatarPreview,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar className="h-20 w-20 border-2 border-muted-foreground/10">
            <AvatarImage src={avatarPreview} alt="Avatar" />
            <AvatarFallback className="bg-muted text-muted-foreground text-lg font-medium">
              {firstName?.[0]}
              {lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <label
            htmlFor="avatar-upload"
            className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-foreground text-primary-foreground shadow-md hover:bg-foreground/90 transition-colors"
          >
            <Camera className="h-3.5 w-3.5" />
            <input
              id="avatar-upload"
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleAvatarChange}
            />
          </label>
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Profile Photo</p>
          <p className="text-xs text-muted-foreground">Click the icon to upload</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="jobTitle">Job Title <span className="text-destructive">*</span></Label>
        <Select
          value={watch("jobTitle")}
          onValueChange={(val) => setValue("jobTitle", val)}
        >
          <SelectTrigger className={errors.jobTitle ? "border-destructive focus-visible:ring-destructive" : ""}>
            <SelectValue placeholder="Select your job title" />
          </SelectTrigger>
          <SelectContent>
            {JOB_TITLES.map((title) => (
              <SelectItem key={title} value={title}>
                {title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.jobTitle && <p className="text-xs text-destructive">{errors.jobTitle.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input id="firstName" placeholder="John" {...register("firstName")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input id="lastName" placeholder="Doe" {...register("lastName")} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="john@example.com" {...register("email")} />
        </div>
        <div className="space-y-2">
          <Label>Phone <span className="text-destructive">*</span></Label>
          <div className="flex gap-2">
            <Select
              value={watch("countryCode")}
              onValueChange={(val) => setValue("countryCode", val)}
            >
              <SelectTrigger className={`w-[110px] shrink-0 ${errors.countryCode ? "border-destructive focus-visible:ring-destructive" : ""}`}>
                <SelectValue>
                  {COUNTRY_CODES.find((c) => c.code === watch("countryCode"))?.flag}{" "}
                  {watch("countryCode")}
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
            <Input className={`flex-1 ${errors.phone ? "border-destructive focus-visible:ring-destructive" : ""}`} placeholder="555 123 4567" {...register("phone")} />
          </div>
          {(errors.phone || errors.countryCode) && (
            <p className="text-xs text-destructive">
              {errors.phone?.message || errors.countryCode?.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input id="address" placeholder="123 Main St, City, Country" {...register("address")} />
      </div>
    </form>
  );
});
