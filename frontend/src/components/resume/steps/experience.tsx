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
import {
  experienceSchema,
  type ExperienceFormData,
} from "@/lib/resume-validations";
import type { Experience } from "@/types/resume";

interface Props {
  data: Experience[];
  onSave: (items: Experience[]) => void;
}

export function ExperienceStep({ data, onSave }: Props) {
  const [items, setItems] = useState<Experience[]>(data);
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
  } = useForm<ExperienceFormData>({
    resolver: zodResolver(experienceSchema),
  });

  const openAdd = () => {
    setEditingId(null);
    reset({
      company: "",
      position: "",
      location: "",
      startDate: "",
      endDate: "",
      isCurrent: false,
      highlights: [],
    });
    setDialogOpen(true);
  };

  const openEdit = (item: Experience) => {
    setEditingId(item.id);
    reset({
      company: item.company,
      position: item.position,
      location: item.location,
      startDate: item.startDate,
      endDate: item.endDate,
      isCurrent: item.isCurrent,
      highlights: item.highlights,
    });
    setDialogOpen(true);
  };

  const remove = (id: string) => {
    setItems((prev) => prev.filter((e) => e.id !== id));
  };

  const onSubmit = (formData: ExperienceFormData) => {
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
              <p className="font-medium text-foreground">{item.position}</p>
              <p className="text-sm text-muted-foreground">
                {item.company}
                {item.location ? ` \u00b7 ${item.location}` : ""}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {item.startDate} \u2013 {item.isCurrent ? "Present" : item.endDate}
              </p>
              {item.highlights.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {item.highlights.map((h, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="mt-1.5 h-1 w-1 rounded-full bg-muted-foreground/40 shrink-0" />
                      {h}
                    </li>
                  ))}
                </ul>
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
            No experience added yet.
          </p>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full border-dashed" onClick={openAdd}>
            <Plus className="mr-2 h-4 w-4" /> Add Experience
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Experience" : "Add Experience"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Position</Label>
              <Input placeholder="Senior Engineer" {...register("position")} />
              {errors.position && (
                <p className="text-sm text-destructive">{errors.position.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Company</Label>
              <Input placeholder="Acme Corp" {...register("company")} />
              {errors.company && (
                <p className="text-sm text-destructive">{errors.company.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input placeholder="San Francisco, CA" {...register("location")} />
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
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isCurrent" {...register("isCurrent")} className="rounded" />
              <Label htmlFor="isCurrent">I currently work here</Label>
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
