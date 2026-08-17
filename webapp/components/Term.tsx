"use client";

import { useEffect, useRef, useState } from "react";
import { glossaryBySlug } from "@/lib/glossary";

/**
 * Glossary term with a definition popover. Hover opens it on mouse devices;
 * click or tap pins it (needed for touch). Every card links to the full
 * entry on the glossary page. Rendered as a true inline span (not a button)
 * so terms wrap like ordinary text.
 */
export default function Term({
  k,
  children,
}: {
  k: string;
  children: React.ReactNode;
}) {
  const entry = glossaryBySlug.get(k);
  const wrap = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (!pinned) return;
    const onDoc = (e: Event) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) {
        setPinned(false);
        setOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPinned(false);
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("pointerdown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [pinned]);

  if (!entry) return <>{children}</>;

  // Clamp the card inside the viewport: center it on the term where
  // possible, otherwise slide it just enough to keep an 8px margin.
  const measure = () => {
    const el = wrap.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const w = Math.min(288, vw * 0.85);
    const c = (r.left + r.right) / 2;
    const left = Math.min(Math.max(c - w / 2, 8), vw - w - 8);
    setOffset(left - r.left);
  };

  const toggle = () => {
    measure();
    setOpen(!pinned);
    setPinned(!pinned);
  };

  return (
    <span ref={wrap} className="relative">
      <span
        role="button"
        tabIndex={0}
        aria-expanded={open}
        className="cursor-help border-b border-dotted border-[var(--lavender)]/55 hover:border-[var(--lavender)] focus-visible:outline focus-visible:outline-1 focus-visible:outline-[var(--lavender)]"
        onPointerEnter={(e) => {
          if (e.pointerType === "mouse") {
            measure();
            setOpen(true);
          }
        }}
        onPointerLeave={(e) => {
          if (e.pointerType === "mouse" && !pinned) setOpen(false);
        }}
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggle();
          }
        }}
      >
        {children}
      </span>
      {open && (
        <span
          role="tooltip"
          style={{ left: offset }}
          className="absolute top-full z-30 mt-1.5 block w-72 max-w-[85vw] rounded-md border border-[var(--line)] bg-[var(--panel-2)] p-3 text-left font-normal normal-case tracking-normal shadow-xl"
        >
          <span className="block text-xs font-medium not-italic text-[var(--gold)]">
            {entry.term}
          </span>
          <span className="mt-1 block text-xs font-light leading-5 not-italic text-[var(--ink-dim)]">
            {entry.short}
          </span>
          <a
            className="lnk mt-1.5 inline-block text-[11px] not-italic"
            href={`/glossary/#${entry.slug}`}
          >
            full entry →
          </a>
        </span>
      )}
    </span>
  );
}
