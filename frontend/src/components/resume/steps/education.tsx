"use client";

import { useEffect, useState } from "react";
import { v4 as uuid } from "uuid";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { educationSchema, type EducationFormData } from "@/lib/resume-validations";
import type { Education } from "@/types/resume";

interface Props {
  data: Education[];
  onSave: (items: Education[]) => void;
}

export function EducationStep({ data, onSave }: Props) {
  const [items, setItems] = useState<Education[]>(data);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    setItems(data);
  }, [data]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EducationFormData>({
    resolver: zodResolver(educationSchema),
  });

  const openAdd = () => {
    setEditingId(null);
    reset({
      institution: "",
      degree: "",
      fieldOfStudy: "",
      startDate: "",
      endDate: "",
      gpa: 0,
      description: "",
    });
    setDialogOpen(true);
  };

  const openEdit = (item: Education) => {
    setEditingId(item.id);
    reset({
      institution: item.institution,
      degree: item.degree,
      fieldOfStudy: item.fieldOfStudy,
      startDate: item.startDate,
      endDate: item.endDate,
      gpa: item.gpa,
      description: item.description,
    });
    setDialogOpen(true);
  };

  const remove = (id: string) => {
    setItems((prev) => prev.filter((e) => e.id !== id));
  };

  const onSubmit = (formData: EducationFormData) => {
    if (editingId) {
      setItems((prev) =>
        prev.map((e) => (e.id === editingId ? { ...e, ...formData, id: editingId } : e))
      );
    } else {
      setItems((prev) => [...prev, { ...formData, id: uuid() }]);
    }
    setDialogOpen(false);
    reset();
  };

  const handleSaveAll = () => {
    onSave(items);
  };

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="group flex items-start justify-between rounded-lg border border-border/60 bg-white p-4 hover:shadow-sm transition-shadow"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground">
                {item.degree}
                {item.fieldOfStudy ? ` in ${item.fieldOfStudy}` : ""}
              </p>
              <p className="text-sm text-muted-foreground">{item.institution}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {item.startDate} \u2013 {item.endDate || "Present"}
                {item.gpa ? ` \u00b7 GPA: ${item.gpa}` : ""}
              </p>
              {item.description && (
                <p className="text-sm text-muted-foreground mt-2">{item.description}</p>
              )}
            </div>
            <div className="flex gap-1 ml-3 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => remove(item.id)}>
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No education added yet.
          </p>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full border-dashed" onClick={openAdd}>
            <Plus className="mr-2 h-4 w-4" /> Add Education
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Education" : "Add Education"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Institution</Label>
              <Input placeholder="MIT" {...register("institution")} />
              {errors.institution && (
                <p className="text-sm text-destructive">{errors.institution.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Degree</Label>
                <Input placeholder="Bachelor" {...register("degree")} />
                {errors.degree && (
                  <p className="text-sm text-destructive">{errors.degree.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Field of Study</Label>
                <Input placeholder="Computer Science" {...register("fieldOfStudy")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="month" {...register("startDate")} />
                {errors.startDate && (
                  <p className="text-sm text-destructive">{errors.startDate.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="month" {...register("endDate")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>GPA (optional)</Label>
              <Input type="number" step="0.1" min="0" max="4" {...register("gpa", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Input placeholder="Relevant coursework, honors..." {...register("description")} />
            </div>
            <Button type="submit" className="w-full bg-foreground hover:bg-foreground/90 text-primary-foreground font-medium">
              {editingId ? "Update" : "Add"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
