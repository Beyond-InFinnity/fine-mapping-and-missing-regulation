"use client";

import { useState } from "react";
import Waterfall from "@/components/Waterfall";
import EvidenceHeatmap from "@/components/EvidenceHeatmap";
import LocusTable from "@/components/LocusTable";
import { loci, summary } from "@/lib/data";
import type { Attribution } from "@/lib/types";

function Tile({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      <div className="mt-1 text-xs text-zinc-500">{label}</div>
    </div>
  );
}

export default function Dashboard() {
  const [sel, setSel] = useState<Attribution | null>(null);
  const explained = summary.nLoci - summary.nUnexplained;

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-xl font-semibold tracking-tight">
          Why don&apos;t schizophrenia risk loci colocalize with brain eQTLs?
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-600 dark:text-zinc-300">
          281 genome-wide significant loci from the PGC3 schizophrenia GWAS,
          tested for shared causal variants against six molecular channels:
          bulk expression (14 brain datasets), fine-mapped multi-signal
          colocalization, single-cell eQTLs (8 cell types), fetal cortex
          eQTLs, splicing QTLs (17 datasets), and brain DNA methylation QTLs.
          Click a bar to filter; click any locus for its full evidence card.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile
          value={`${Math.round((summary.stage1Fractions.any_brain.fraction) * 100)}%`}
          label="loci with any bulk brain eQTL colocalization (PP4 > 0.8)"
        />
        <Tile
          value={`${Math.round((explained / summary.nLoci) * 100)}%`}
          label="explained after all six molecular channels"
        />
        <Tile
          value={String(summary.nUnexplained)}
          label="loci unexplained by every tested channel"
        />
        <Tile
          value={String(summary.nominations.orphanHigh)}
          label="expression-orphan loci with high-confidence gene nominations"
        />
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="mb-2 text-sm font-semibold">
            Sequential attribution across channels
          </h2>
          <Waterfall summary={summary} selected={sel} onSelect={setSel} />
        </div>
        <div>
          <h2 className="mb-2 text-sm font-semibold">
            Evidence matrix: best PP4 per locus and channel
          </h2>
          <EvidenceHeatmap loci={loci} filter={sel} />
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold">All loci</h2>
        <LocusTable loci={loci} filter={sel} />
      </section>
    </div>
  );
}
