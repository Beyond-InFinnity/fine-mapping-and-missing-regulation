"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
          Candidate genes linked to risk loci through the methylation chain:
          chain score = min(GWAS↔CpG PP4, CpG↔gene PP4). Expression-orphan
          rows are loci with no direct eQTL colocalization anywhere. Distant
          CpG-to-TSS nominations warrant caution; use the filter.
        </p>
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
