"use client";

import { useState, useRef, useCallback } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function TagInput({ value, onChange, placeholder = "Type and press Enter...", className, disabled }: TagInputProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = useCallback(
    (raw: string) => {
      const tag = raw.trim();
      if (!tag || value.includes(tag)) return;
      onChange([...value, tag]);
      setInput("");
    },
    [value, onChange]
  );

  const removeTag = useCallback(
    (tag: string) => {
      onChange(value.filter((t) => t !== tag));
    },
    [value, onChange]
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    }
    if (e.key === "Backspace" && !input && value.length) {
      removeTag(value[value.length - 1]);
    }
  }

  return (
    <div
      className={cn(
        "flex flex-wrap gap-2 rounded-md border border-input bg-background px-3 py-2 min-h-[42px] cursor-text focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-shadow",
        className
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((tag) => (
        <Badge key={tag} variant="secondary" className="gap-1 pr-1.5">
          {tag}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeTag(tag);
            }}
            className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
            disabled={disabled}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <input
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => input && addTag(input)}
        placeholder={value.length === 0 ? placeholder : ""}
        disabled={disabled}
        className="flex-1 min-w-[120px] bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
}
