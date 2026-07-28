"use client";

import { useEffect, useState } from "react";

interface UseScrollSpyOptions {
  sectionSelector?: string;
  
  offset?: number;
}

export function useScrollSpy({
  sectionSelector = "[data-section]",
  offset = 140,
}: UseScrollSpyOptions = {}) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const getElements = () =>
      Array.from(document.querySelectorAll<HTMLElement>(sectionSelector));

    const calculate = () => {
      const elements = getElements();
      if (!elements.length) return;

      const scrollTop = window.scrollY;

      let current = elements[0];
      for (const el of elements) {
        if (el.getBoundingClientRect().top <= offset) {
          current = el;
        }
      }

      const id = current.getAttribute("data-section");
      if (id) setActiveId(id);
    };

    calculate();

    window.addEventListener("scroll", calculate, { passive: true });

    const ro = new ResizeObserver(calculate);
    getElements().forEach((el) => ro.observe(el));

    window.addEventListener("hashchange", calculate);

    return () => {
      window.removeEventListener("scroll", calculate);
      window.removeEventListener("hashchange", calculate);
      ro.disconnect();
    };
  }, [sectionSelector, offset]);

  return activeId;
}
