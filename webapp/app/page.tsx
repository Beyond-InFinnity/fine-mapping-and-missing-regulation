"use client";

import { useState } from "react";
import Waterfall from "@/components/Waterfall";
import EvidenceHeatmap from "@/components/EvidenceHeatmap";
import LocusTable from "@/components/LocusTable";
import { loci, summary } from "@/lib/data";
import type { Attribution } from "@/lib/types";

function Tile({ value, label }: { value: string; label: string }) {
  return (
    <div className="panel p-5">
      <div className="text-[1.75rem] font-semibold tabular-nums leading-none text-[var(--gold-bright)]">
        {value}
      </div>
      <div className="mt-2.5 text-xs font-light leading-4 text-[var(--muted)]">
        {label}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [sel, setSel] = useState<Attribution | null>(null);
  const explained = summary.nLoci - summary.nUnexplained;

  return (
    <div className="space-y-10">
      <section>
        <h1 className="font-display text-3xl leading-tight text-[var(--ink)]">
          Why do schizophrenia risk loci <strong>not</strong> colocalize with
          brain eQTLs?
        </h1>
        <p className="mt-3 max-w-3xl text-sm font-light leading-6 text-[var(--ink-dim)]">
          281 genome-wide significant loci from the PGC3 schizophrenia GWAS,
          tested for shared causal variants against six molecular channels:
          bulk expression (14 brain datasets), fine-mapped multi-signal
          colocalization, single-cell eQTLs (8 cell types), fetal cortex
          eQTLs, splicing QTLs (17 datasets), and brain DNA methylation QTLs.
          Click a bar to filter; click any locus for its full evidence card.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Tile
          value={`${Math.round(summary.stage1Fractions.any_brain.fraction * 100)}%`}
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

      <section className="grid gap-10 lg:grid-cols-2">
        <div>
          <h2 className="kicker mb-3 !text-[var(--gold)]">
            Sequential attribution across channels
          </h2>
          <Waterfall summary={summary} selected={sel} onSelect={setSel} />
        </div>
        <div>
          <h2 className="kicker mb-3 !text-[var(--gold)]">
            Evidence matrix · best PP4 per locus and channel
          </h2>
          <EvidenceHeatmap loci={loci} filter={sel} />
        </div>
      </section>

      <section>
        <h2 className="kicker mb-3 !text-[var(--gold)]">All loci</h2>
        <LocusTable loci={loci} filter={sel} />
      </section>
    </div>
  );
}
