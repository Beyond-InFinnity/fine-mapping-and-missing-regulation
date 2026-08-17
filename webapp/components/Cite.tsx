"use client";

import { useRef, useState } from "react";
import { refByKey, refNumber } from "@/lib/references";

/**
 * Inline citation: a superscript number linked to the DOI, with the full
 * reference shown in a hover card. Numbers follow the order of
 * lib/references.ts, which matches the manuscript's alphabetical list.
 */
export default function Cite({ k }: { k: string }) {
  const r = refByKey(k);
  const wrap = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const [offset, setOffset] = useState(0);

  if (!r) return null;

  // Clamp the card inside the viewport: center it on the marker where
  // possible, otherwise slide it just enough to keep an 8px margin.
  const measure = () => {
    const el = wrap.current;
    if (!el) return;
    const b = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const w = Math.min(320, vw * 0.85);
    const c = (b.left + b.right) / 2;
    const left = Math.min(Math.max(c - w / 2, 8), vw - w - 8);
    setOffset(left - b.left);
  };

  return (
    <sup ref={wrap} className="relative leading-none">
      <a
        href={`https://doi.org/${r.doi}`}
        target="_blank"
        rel="noopener noreferrer"
        className="px-0.5 text-[0.72em] font-normal not-italic text-[var(--gold)] hover:text-[var(--gold-bright)]"
        onPointerEnter={(e) => {
          if (e.pointerType === "mouse") {
            measure();
            setOpen(true);
          }
        }}
        onPointerLeave={(e) => {
          if (e.pointerType === "mouse") setOpen(false);
        }}
      >
        [{refNumber(k)}]
      </a>
      {open && (
        <span
          role="tooltip"
          style={{ left: offset }}
          className="absolute top-full z-30 mt-1 block w-80 max-w-[85vw] rounded-md border border-[var(--line)] bg-[var(--panel-2)] p-3 text-left text-xs font-light normal-case leading-5 tracking-normal text-[var(--ink-dim)] shadow-xl"
        >
          {r.authors} ({r.year}). {r.title}. <i>{r.journal}</i>.
        </span>
      )}
    </sup>
  );
}
