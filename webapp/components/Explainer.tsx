import type { ReactNode } from "react";

/**
 * Collapsible reading guide attached to a figure or table. Native <details>,
 * so it works in the static export without JavaScript.
 */
export default function Explainer({
  title = "How to read this",
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <details className="group mt-3 rounded-md border border-[var(--line)] bg-[var(--panel)]">
      <summary className="flex cursor-pointer list-none select-none items-center gap-2 px-4 py-2.5 text-xs font-medium text-[var(--gold)] hover:text-[var(--gold-bright)] [&::-webkit-details-marker]:hidden">
        <span
          aria-hidden
          className="text-[9px] transition-transform duration-150 group-open:rotate-90"
        >
          ▶
        </span>
        {title}
      </summary>
      <div className="space-y-4 border-t border-[var(--line)] px-4 pb-4 pt-3">
        {children}
      </div>
    </details>
  );
}

export function ExplainerSection({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-1 text-[11px] font-medium tracking-[0.02em] text-[var(--lavender)]">
        {label}
      </div>
      <div className="max-w-3xl text-[13px] font-light leading-6 text-[var(--ink-dim)]">
        {children}
      </div>
    </div>
  );
}

/** Paired lists: what the evidence supports (✓) and what it does not show (✕). */
export function Takeaways({
  yes,
  no,
}: {
  yes: ReactNode[];
  no: ReactNode[];
}) {
  return (
    <ul className="max-w-3xl space-y-1.5 text-[13px] font-light leading-6 text-[var(--ink-dim)]">
      {yes.map((t, i) => (
        <li key={`y${i}`} className="flex gap-2">
          <span aria-hidden className="shrink-0 text-[var(--gold)]">
            ✓
          </span>
          <span>{t}</span>
        </li>
      ))}
      {no.map((t, i) => (
        <li key={`n${i}`} className="flex gap-2">
          <span aria-hidden className="shrink-0 text-[var(--rose)]">
            ✕
          </span>
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}
