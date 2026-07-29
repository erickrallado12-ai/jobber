"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { searchLocations } from "@/lib/api";
import type { LocationResult } from "@/lib/api";

interface CityInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function CityInput({
  value,
  onChange,
  placeholder = "City or state...",
  className,
}: CityInputProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<LocationResult[]>([]);
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
    searchLocations(q, 10)
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
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fetchResults(val), 200);
  }

  function handleFocus() {
    if (query.length >= 1) fetchResults(query);
  }

  function handleSelect(loc: LocationResult) {
    const display =
      loc.state_nombre === loc.nombre
        ? loc.nombre
        : `${loc.nombre}, ${loc.state_nombre}`;
    setQuery(display);
    lastSyncedRef.current = loc.nombre;
    onChange(loc.nombre);
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
      <div className="relative flex items-center gap-3">
        <MapPin className="h-4.5 w-4.5 text-muted-foreground shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className={cn(
            "w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none",
          )}
        />
        {loading && (
          <Loader2 className="h-4 w-4 text-muted-foreground animate-spin shrink-0" />
        )}
      </div>

      {open && results.length > 0 && typeof document !== "undefined" && createPortal(
        <div
          className="rounded-xl border border-gray-200 bg-white shadow-lg shadow-gray-200/50 max-h-60 overflow-y-auto"
          style={menuStyle}
        >
          {results.map((loc, i) => {
            const display =
              loc.state_nombre === loc.nombre
                ? loc.nombre
                : `${loc.nombre}, ${loc.state_nombre}`;
            return (
              <button
                key={loc.clave}
                type="button"
                className={cn(
                  "w-full text-left px-3 py-2.5 text-sm flex items-center gap-2.5 cursor-pointer outline-none transition-colors first:rounded-t-xl last:rounded-b-xl",
                  i === activeIdx
                    ? "bg-teal-50 text-teal-700"
                    : "hover:bg-gray-50 text-foreground"
                )}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(loc);
                }}
                onMouseEnter={() => setActiveIdx(i)}
              >
                <MapPin className="h-3.5 w-3.5 shrink-0 text-teal-400" />
                <span>{display}</span>
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
}
