"use client";

import { useState } from "react";
import Link from "next/link";
import Waterfall from "@/components/Waterfall";
import EvidenceHeatmap from "@/components/EvidenceHeatmap";
import LocusTable from "@/components/LocusTable";
import Explainer, {
  ExplainerSection,
  Takeaways,
} from "@/components/Explainer";
import Term from "@/components/Term";
import Cite from "@/components/Cite";
import { loci, summary } from "@/lib/data";
import type { Attribution } from "@/lib/types";

function Tile({ value, label }: { value: string; label: React.ReactNode }) {
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
          In plain terms: hundreds of small DNA differences raise the risk of
          schizophrenia, and nearly all of them sit outside genes rather than
          inside them. This project asks whether each one works by changing
          how strongly nearby genes are used in the brain, and tallies how
          much of the risk map that idea can explain with public data. New to
          the topic?{" "}
          <Link className="lnk" href="/guide/">
            Start with the reader&rsquo;s guide
          </Link>
          .
        </p>
        <p className="mt-3 max-w-3xl text-sm font-light leading-6 text-[var(--ink-dim)]">
          281 genome-wide significant <Term k="locus">loci</Term> from the{" "}
          <Term k="pgc3">PGC3</Term> schizophrenia GWAS
          <Cite k="trubetskoy2022" />, tested for{" "}
          <Term k="colocalization">shared causal variants</Term> against six
          molecular channels: bulk expression (14 brain datasets), fine-mapped
          multi-signal colocalization, single-cell{" "}
          <Term k="eqtl">eQTLs</Term> (8 cell types), fetal cortex eQTLs,
          splicing QTLs (17 datasets), and brain DNA{" "}
          <Term k="mqtl">methylation QTLs</Term>. Click a bar to filter; click
          any locus for its full evidence card.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Tile
          value={`${Math.round(summary.stage1Fractions.any_brain.fraction * 100)}%`}
          label={
            <>
              loci with any bulk brain eQTL colocalization (
              <Term k="pp4">PP4</Term> &gt; 0.8)
            </>
          }
        />
        <Tile
          value={`${Math.round((explained / summary.nLoci) * 100)}%`}
          label={
            <>
              explained after all six molecular channels (
              <Term k="attribution">sequential attribution</Term>)
            </>
          }
        />
        <Tile
          value={String(summary.nUnexplained)}
          label="loci unexplained by every tested channel"
        />
        <Tile
          value={String(summary.nominations.orphanHigh)}
          label={
            <>
              <Term k="expression-orphan">expression-orphan</Term> loci with
              high-confidence gene nominations
            </>
          }
        />
      </section>

      <section className="grid gap-10 lg:grid-cols-2">
        <div>
          <h2 className="kicker mb-3 !text-[var(--gold)]">
            Sequential attribution across channels
          </h2>
          <Waterfall summary={summary} selected={sel} onSelect={setSel} />
          <Explainer title="How to read this figure">
            <ExplainerSection label="What this data is">
              The 281 schizophrenia risk loci, each tested against six kinds
              of molecular evidence in a fixed order and credited to the
              first kind that produced a{" "}
              <Term k="colocalization">colocalization</Term> at{" "}
              <Term k="pp4">PP4</Term> &gt; 0.8.
            </ExplainerSection>
            <ExplainerSection label="How to read it">
              Bars run left to right in testing order. Each bar&rsquo;s
              height is the number of loci newly explained by that channel
              after everything to its left has had its turn, and the bars
              stack toward the dashed line at 281. The gray bar is the{" "}
              {summary.nUnexplained} loci no channel explained. Click a bar
              to filter the matrix and the table to those loci.
            </ExplainerSection>
            <ExplainerSection label="What to take away, and what not to">
              <Takeaways
                yes={[
                  <>
                    Bulk brain expression explains 90 of 281 loci (32%); the
                    other five channels raise the total to {281 - summary.nUnexplained} (
                    {Math.round(((281 - summary.nUnexplained) / 281) * 100)}
                    %), with methylation the largest single addition.
                  </>,
                ]}
                no={[
                  <>
                    Bar heights are not total hit counts: a locus with both
                    splicing and methylation evidence counts under splicing
                    because splicing is tested first.
                  </>,
                  <>
                    Explained means a molecular trait shares a causal variant
                    with the GWAS signal, not that the causal gene is
                    identified.
                  </>,
                ]}
              />
            </ExplainerSection>
          </Explainer>
        </div>
        <div>
          <h2 className="kicker mb-3 !text-[var(--gold)]">
            Evidence matrix · best PP4 per locus and channel
          </h2>
          <EvidenceHeatmap loci={loci} filter={sel} />
          <Explainer title="How to read this figure">
            <ExplainerSection label="What this data is">
              One row per locus (281 rows), one column per evidence channel.
              Each cell shows the best <Term k="pp4">PP4</Term> across all
              datasets in that channel; the thin left strip carries the
              locus&rsquo;s final attribution color.
            </ExplainerSection>
            <ExplainerSection label="How to read it">
              Brighter is stronger, turning light near PP4 0.8 and above.
              Cells in the background color mean no valid test was possible,
              which is different from a tested-but-weak dark blue cell. Rows
              are grouped by attribution in waterfall order, strongest bulk
              signal first within each group. Hover a cell for its value;
              click a row to open that locus.
            </ExplainerSection>
            <ExplainerSection label="What to take away, and what not to">
              <Takeaways
                yes={[
                  <>
                    The methylation column stays dense in the row groups
                    where every expression column goes dark. That contrast is
                    the central observation of the project.
                  </>,
                ]}
                no={[
                  <>
                    A bright cell says two signals are consistent with one
                    shared variant; it does not name the causal gene. Columns
                    also differ in depth, from 14 bulk datasets to a single
                    methylation meta-analysis.
                  </>,
                ]}
              />
            </ExplainerSection>
          </Explainer>
        </div>
      </section>

      <section>
        <h2 className="kicker mb-3 !text-[var(--gold)]">All loci</h2>
        <LocusTable loci={loci} filter={sel} />
        <Explainer title="How to read this table">
          <ExplainerSection label="What this data is">
            Every locus with its best <Term k="pp4">PP4</Term> per channel,
            its attribution, and a top gene: the chained nomination where one
            exists, otherwise the best bulk eQTL gene.
          </ExplainerSection>
          <ExplainerSection label="How to read it">
            Click a column header to sort; type in the box to search by
            locus, rsID, or gene. A dash means no valid test in that channel.
            Values at or above 0.8 are shown in bold gold. Locus IDs link to
            the full evidence card.
          </ExplainerSection>
          <ExplainerSection label="What to take away, and what not to">
            <Takeaways
              yes={[
                <>
                  Sorting by the Methylation column shows how many loci have
                  their only strong evidence there.
                </>,
              ]}
              no={[
                <>
                  PP4 values are not comparable measures of importance across
                  channels; sample sizes and numbers of tested traits differ
                  widely between them.
                </>,
              ]}
            />
          </ExplainerSection>
        </Explainer>
      </section>
    </div>
  );
}
