import type { Metadata } from "next";
import Link from "next/link";
import { GLOSSARY } from "@/lib/glossary";

export const metadata: Metadata = {
  title: "Glossary | Missing Regulation",
  description:
    "Definitions of every technical term used on this site, from GWAS and LD to PP4 and the methylation chain.",
};

export default function GlossaryPage() {
  const sorted = [...GLOSSARY].sort((a, b) =>
    a.term.localeCompare(b.term, "en", { sensitivity: "base" }),
  );
  const bySlug = new Map(sorted.map((g) => [g.slug, g]));

  let lastLetter = "";

  return (
    <div className="max-w-3xl">
      <p className="kicker !text-[var(--gold)]">Reference</p>
      <h1 className="mt-1 font-display text-3xl leading-tight">Glossary</h1>
      <p className="mt-3 text-sm font-light leading-6 text-[var(--ink-dim)]">
        Every technical term used on this site, in one place.
        Dotted-underlined words across the site open these same definitions
        in a small card; this page holds the full versions. New to the
        subject entirely? The{" "}
        <Link className="lnk" href="/guide/">
          reader&rsquo;s guide
        </Link>{" "}
        builds the concepts up in order.
      </p>

      <div className="mt-5 flex flex-wrap gap-1.5">
        {sorted.map((g) => (
          <a
            key={g.slug}
            href={`#${g.slug}`}
            className="rounded-full border border-[var(--line)] bg-[var(--panel)] px-2.5 py-0.5 text-[11px] font-light text-[var(--ink-dim)] hover:border-[var(--gold)] hover:text-[var(--gold-bright)]"
          >
            {g.term}
          </a>
        ))}
      </div>

      <dl className="mt-8">
        {sorted.map((g) => {
          const letter = g.term[0].toUpperCase();
          const showLetter = letter !== lastLetter;
          lastLetter = letter;
          return (
            <div
              key={g.slug}
              id={g.slug}
              className="scroll-mt-6 border-t border-[var(--line)] py-4"
            >
              {showLetter && (
                <div className="mb-2 font-display text-sm text-[var(--muted)]">
                  {letter}
                </div>
              )}
              <dt className="text-sm font-medium text-[var(--ink)]">
                {g.term}
              </dt>
              <dd className="mt-1.5 text-sm font-light leading-6 text-[var(--ink-dim)]">
                {g.long}
                {g.seeAlso && g.seeAlso.length > 0 && (
                  <span className="mt-1.5 block text-xs text-[var(--muted)]">
                    See also:{" "}
                    {g.seeAlso.map((s, i) => (
                      <span key={s}>
                        {i > 0 && " · "}
                        <a className="lnk" href={`#${s}`}>
                          {bySlug.get(s)?.term ?? s}
                        </a>
                      </span>
                    ))}
                  </span>
                )}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
