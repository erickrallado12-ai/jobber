"use client";

import { useEffect, useState, useCallback } from "react";
import { X, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Props {
  data: string[];
  onSave: (skills: string[]) => void;
}

const SKILL_CATEGORIES: Record<string, string[]> = {
  "Industry Knowledge": [
    "User Centered Design", "Agile Methodologies", "Scrum",
    "Product Strategy", "Market Research", "Data Analysis",
    "Business Intelligence", "Requirements Gathering",
    "A/B Testing", "Accessibility (WCAG)",
  ],
  "Tools & Technologies": [
    "Figma", "Sketch", "Adobe XD", "Photoshop", "Illustrator",
    "Jira", "Confluence", "Notion", "Trello",
    "VS Code", "Git", "GitHub", "Docker", "Kubernetes",
    "AWS", "GCP", "Azure", "Firebase",
  ],
  "Programming Languages": [
    "JavaScript", "TypeScript", "Python", "Go", "Rust",
    "Java", "C++", "C#", "Swift", "Kotlin",
    "Ruby", "PHP", "SQL", "HTML", "CSS",
  ],
  "Frameworks & Libraries": [
    "React", "Next.js", "Vue.js", "Angular", "Svelte",
    "Node.js", "Django", "FastAPI", "Flask", "Express",
    "Spring Boot", "Ruby on Rails", ".NET",
    "Tailwind CSS", "Bootstrap",
  ],
  "Databases": [
    "PostgreSQL", "MySQL", "MongoDB", "Redis",
    "Elasticsearch", "DynamoDB", "Firebase Firestore",
    "Supabase", "Prisma", "SQLAlchemy",
  ],
  "Soft Skills": [
    "Leadership", "Communication", "Teamwork",
    "Problem Solving", "Time Management", "Critical Thinking",
    "Presentation Skills", "Mentoring",
  ],
};

const ALL_SKILLS = Object.values(SKILL_CATEGORIES).flat();

export function SkillsStep({ data, onSave }: Props) {
  const [skills, setSkills] = useState<string[]>(data);
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    setSkills(data);
  }, [data]);

  const availableSuggestions = ALL_SKILLS.filter(
    (s) => !skills.includes(s)
  );

  const addSkill = useCallback((skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills((prev) => [...prev, trimmed]);
    }
    setInputValue("");
    setOpen(false);
  }, [skills]);

  const removeSkill = useCallback((skill: string) => {
    setSkills((prev) => prev.filter((s) => s !== skill));
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      addSkill(inputValue);
    }
  };

  const groupedSuggestions = Object.entries(SKILL_CATEGORIES).map(
    ([category, categorySkills]) => ({
      category,
      skills: categorySkills.filter((s) => !skills.includes(s) && s.toLowerCase().includes(inputValue.toLowerCase())),
    })
  ).filter((g) => g.skills.length > 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2 min-h-[60px] rounded-lg border border-border/60 bg-white p-4">
        {skills.map((skill) => (
          <Badge
            key={skill}
            variant="secondary"
            className="gap-1 pr-1 bg-muted text-foreground hover:bg-muted/80"
          >
            {skill}
            <button
              type="button"
              onClick={() => removeSkill(skill)}
              className="ml-1 rounded-full p-0.5 hover:bg-foreground/10 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        {skills.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No skills added yet. Start typing to add one.
          </p>
        )}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full border-dashed" onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Skill
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search or type a skill..."
              value={inputValue}
              onValueChange={setInputValue}
              onKeyDown={handleKeyDown}
            />
            <CommandList>
              <CommandEmpty>
                {inputValue.trim() && (
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => addSkill(inputValue)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add &ldquo;{inputValue}&rdquo;
                  </Button>
                )}
                {!inputValue.trim() && (
                  <p className="text-sm text-muted-foreground py-2">Type to search skills...</p>
                )}
              </CommandEmpty>
              {groupedSuggestions.map(({ category, skills: categorySkills }) => (
                <CommandGroup key={category} heading={category}>
                  {categorySkills.slice(0, 6).map((skill) => (
                    <CommandItem
                      key={skill}
                      value={skill}
                      onSelect={() => addSkill(skill)}
                    >
                      {skill}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
