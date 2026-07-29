"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Briefcase, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { searchKeywords } from "@/lib/api";

interface KeywordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  const idx = lower.indexOf(q);
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className="text-teal-600 font-semibold">{text.slice(idx, idx + q.length)}</span>
      {text.slice(idx + q.length)}
    </>
  );
}

export function KeywordInput({
  value,
  onChange,
  placeholder = "Job title, keywords, or company",
  className,
}: KeywordInputProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lastSyncedRef = useRef(value);

  useEffect(() => {
    if (value !== lastSyncedRef.current) {
      lastSyncedRef.current = value;
      setQuery(value);
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function updateMenuPosition() {
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      setMenuStyle({
        position: "fixed",
        left: `${rect.left}px`,
        top: `${rect.bottom + 4}px`,
        width: `${Math.max(rect.width, 320)}px`,
        zIndex: 99999,
      });
    }
  }

  useEffect(() => {
    if (open) {
      updateMenuPosition();
      window.addEventListener("scroll", updateMenuPosition, true);
      window.addEventListener("resize", updateMenuPosition);
    }
    return () => {
      window.removeEventListener("scroll", updateMenuPosition, true);
      window.removeEventListener("resize", updateMenuPosition);
    };
  }, [open, results]);

  const fetchResults = useCallback((q: string) => {
    if (q.length < 1) {
      setResults([]);
      setOpen(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    searchKeywords(q, 10)
      .then((data) => {
        setResults(data);
        setOpen(data.length > 0);
        setActiveIdx(-1);
      })
      .catch(() => {
        setResults([]);
        setOpen(false);
      })
      .finally(() => setLoading(false));
  }, []);

  function handleChange(val: string) {
    setQuery(val);
    lastSyncedRef.current = val;
    onChange(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fetchResults(val), 200);
  }

  function handleFocus() {
    if (query.length >= 1) fetchResults(query);
  }

  function handleSelect(val: string) {
    setQuery(val);
    lastSyncedRef.current = val;
    onChange(val);
    setOpen(false);
    inputRef.current?.focus();
  }

  function handleClear() {
    setQuery("");
    lastSyncedRef.current = "";
    onChange("");
    setResults([]);
    setOpen(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) {
      if (e.key === "Escape") setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => (i < results.length - 1 ? i + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => (i > 0 ? i - 1 : results.length - 1));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      handleSelect(results[activeIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-100/60">
        <Briefcase className="h-4.5 w-4.5 text-teal-400 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
        />
        {query && !loading && (
          <button
            type="button"
            onClick={handleClear}
            className="text-muted-foreground hover:text-foreground shrink-0"
          >
            <Search className="h-4 w-4" />
          </button>
        )}
        {loading && (
          <Loader2 className="h-4 w-4 text-muted-foreground animate-spin shrink-0" />
        )}
      </div>

      {open && results.length > 0 && typeof document !== "undefined" && createPortal(
        <div
          className="rounded-xl border border-gray-200 bg-white shadow-lg shadow-gray-200/50 max-h-60 overflow-y-auto"
          style={menuStyle}
        >
          {results.map((item, i) => (
            <button
              key={item}
              type="button"
              className={cn(
                "w-full text-left px-3 py-2.5 text-sm flex items-center gap-2.5 cursor-pointer outline-none transition-colors first:rounded-t-xl last:rounded-b-xl",
                i === activeIdx
                  ? "bg-teal-50 text-teal-700"
                  : "hover:bg-gray-50 text-foreground"
              )}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(item);
              }}
              onMouseEnter={() => setActiveIdx(i)}
            >
              <Search className="h-3.5 w-3.5 shrink-0 text-teal-400" />
              <span>{highlightMatch(item, query)}</span>
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
