"use client";

import { useEffect, useRef, useCallback } from "react";

interface UseAutoSaveOptions<T> {
  
  key: string;
  
  data: T;
  
  delay?: number;
  
  enabled?: boolean;
}

export function useAutoSave<T>({
  key,
  data,
  delay = 1000,
  enabled = true,
}: UseAutoSaveOptions<T>) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dataRef = useRef(data);
  dataRef.current = data;

  const save = useCallback(() => {
    try {
      const serialized = JSON.stringify(dataRef.current);
      localStorage.setItem(key, serialized);
    } catch {
    }
  }, [key]);

  useEffect(() => {
    if (!enabled) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(save, delay);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [data, delay, enabled, save]);

  const load = useCallback((): T | null => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, [key]);

  const clear = useCallback(() => {
    localStorage.removeItem(key);
  }, [key]);

  return { load, clear, save };
}
