"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Explainer, {
  ExplainerSection,
  Takeaways,
} from "@/components/Explainer";
import Term from "@/components/Term";
import { nominations } from "@/lib/data";

export default function NominationsPage() {
  const [q, setQ] = useState("");
  const [tier, setTier] = useState<"all" | "high" | "suggestive">("high");
  const [orphanOnly, setOrphanOnly] = useState(false);
  const [maxDist, setMaxDist] = useState<number | null>(null);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return nominations
      .filter(
        (n) =>
          (tier === "all" || n.tier === tier) &&
          (!orphanOnly || n.orphan) &&
          (maxDist === null || (n.tssDist !== null && n.tssDist <= maxDist)) &&
          (needle === "" ||
            (n.symbol ?? "").toLowerCase().includes(needle) ||
            n.gene.toLowerCase().includes(needle) ||
            n.locusId.toLowerCase().includes(needle)),
      )
      .sort((a, b) => b.score - a.score);
  }, [q, tier, orphanOnly, maxDist]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl">Gene nominations</h1>
        <p className="mt-1 max-w-3xl text-sm text-[var(--ink-dim)]">
          Candidate genes linked to risk loci through the{" "}
          <Term k="methylation-chain">methylation chain</Term>: chain score =
          min(GWAS↔CpG <Term k="pp4">PP4</Term>, CpG↔gene PP4).{" "}
          <Term k="expression-orphan">Expression-orphan</Term> rows are loci
          with no direct eQTL colocalization anywhere. Distant CpG-to-
          <Term k="tss">TSS</Term> nominations warrant caution; use the
          filter.
        </p>
        <Explainer title="How to read this table">
          <ExplainerSection label="What this data is">
            Every gene reachable from a risk locus in two colocalization
            steps: the GWAS signal shares a causal variant with a CpG&rsquo;s
            methylation signal (GWAS↔CpG), and the same methylation signal
            shares a causal variant with the gene&rsquo;s expression in
            independent data (CpG↔gene). The chain score is the weaker of
            the two links, so a chain is only as strong as its weakest step.
          </ExplainerSection>
          <ExplainerSection label="How to read it">
            High <Term k="tier">tier</Term> means both links reach 0.8, the
            same threshold used for direct colocalization elsewhere on the
            site; suggestive means the weaker link falls between 0.5 and 0.8.
            The orphan column flags loci where no expression test of any kind
            succeeded, which is where these chains matter most. The direct
            eQTL PP4 column shows what direct testing said about this gene,
            and the CpG&ndash;TSS column gives the distance from the
            methylation site to the gene&rsquo;s start; the checkbox filter
            keeps chains within 100 kb.
          </ExplainerSection>
          <ExplainerSection label="What to take away, and what not to">
            <Takeaways
              yes={[
                <>
                  High-tier chains at orphan loci are specific, testable
                  hypotheses for which gene a risk locus regulates, at loci
                  where expression data offered nothing.
                </>,
              ]}
              no={[
                <>
                  A chain does not prove the gene is causal, nor that
                  methylation mediates the effect; both links could reflect
                  the same regulatory element without a causal path through
                  the gene.
                </>,
                <>
                  Chains whose CpG lies far from the gene&rsquo;s start are
                  weaker hypotheses; distance is a prior, not a verdict.
                </>,
              ]}
            />
          </ExplainerSection>
        </Explainer>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search gene or locus…"
          className="w-56 rounded border border-[var(--line)] bg-[var(--panel)] px-2 py-1 text-[var(--ink)]"
        />
        <select
          value={tier}
          onChange={(e) => setTier(e.target.value as typeof tier)}
          className="rounded border border-[var(--line)] bg-[var(--panel)] px-2 py-1 text-[var(--ink)]"
        >
          <option value="high">high tier (≥ 0.8)</option>
          <option value="suggestive">suggestive (0.5–0.8)</option>
          <option value="all">all tiers</option>
        </select>
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={orphanOnly}
            onChange={(e) => setOrphanOnly(e.target.checked)}
          />
          expression-orphan loci only
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={maxDist !== null}
            onChange={(e) => setMaxDist(e.target.checked ? 100000 : null)}
          />
          CpG within 100 kb of TSS
        </label>
        <span className="text-xs text-[var(--muted)]">{rows.length} nominations</span>
      </div>

      <div className="max-h-[600px] panel overflow-auto !rounded-md">
        <table className="table-dark w-full min-w-[820px] text-xs">
          <thead className="sticky top-0 ">
            <tr>
              {[
                "Gene",
                "Locus",
                "Orphan",
                "Tier",
                "Chain score",
                "GWAS↔CpG",
                "CpG↔gene",
                "CpG",
                "CpG–TSS",
                "Direct eQTL PP4",
                "Links",
              ].map((h) => (
                <th key={h} className="px-2 py-2 text-left">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((n, i) => (
              <tr
                key={`${n.locusId}-${n.gene}-${i}`}
                className=""
              >
                <td className="px-2 py-1 font-medium italic">
                  {n.symbol ?? n.gene}
                </td>
                <td className="px-2 py-1">
                  <Link
                    href={`/locus/${n.locusId}/`}
                    className="lnk"
                  >
                    {n.locusId}
                  </Link>
                </td>
                <td className="px-2 py-1">{n.orphan ? "yes" : ""}</td>
                <td className="px-2 py-1">{n.tier}</td>
                <td className="px-2 py-1 font-semibold tabular-nums">
                  {n.score.toFixed(2)}
                </td>
                <td className="px-2 py-1 tabular-nums">
                  {n.cpgGwasPp4.toFixed(2)}
                </td>
                <td className="px-2 py-1 tabular-nums">
                  {n.cpgGenePp4.toFixed(2)}
                </td>
                <td className="px-2 py-1">{n.cpg}</td>
                <td className="px-2 py-1 tabular-nums">
                  {n.tssDist === null
                    ? "–"
                    : `${(n.tssDist / 1000).toFixed(0)} kb`}
                </td>
                <td className="px-2 py-1 tabular-nums">
                  {n.directPp4?.toFixed(2) ?? "–"}
                </td>
                <td className="px-2 py-1">
                  <a
                    className="lnk"
                    href={`https://platform.opentargets.org/target/${n.gene}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    OT
                  </a>{" "}
                  {n.symbol && (
                    <a
                      className="lnk"
                      href={`https://www.genecards.org/cgi-bin/carddisp.pl?gene=${n.symbol}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      GC
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
