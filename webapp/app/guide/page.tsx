import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import Cite from "@/components/Cite";
import Term from "@/components/Term";
import { Takeaways } from "@/components/Explainer";
import { summary } from "@/lib/data";

export const metadata: Metadata = {
  title: "Start here | Missing Regulation",
  description:
    "A plain-language reader's guide to the missing regulation study: what the data are, how the tests work, and what conclusions the results support.",
};

function Section({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-xl leading-snug text-[var(--ink)]">
        <span className="mr-2 text-[var(--gold)]">{n}.</span>
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-sm font-light leading-6 text-[var(--ink-dim)]">
        {children}
      </div>
    </section>
  );
}

const CHANNEL_NOTES: { channel: string; name: string; note: ReactNode }[] = [
  {
    channel: "bulk_expression",
    name: "Bulk expression",
    note: (
      <>
        eQTLs from 14 adult brain datasets: 13 GTEx regions plus the MetaBrain
        cortex meta-analysis. The most direct route from variant to gene.
      </>
    ),
  },
  {
    channel: "susie_rescue",
    name: "Multi-signal rescue",
    note: (
      <>
        The same expression data retested after{" "}
        <Term k="fine-mapping">fine-mapping</Term> separates each locus into
        independent signals, catching loci the single-variant test misjudged.
      </>
    ),
  },
  {
    channel: "single_cell",
    name: "Single-cell eQTL",
    note: (
      <>
        eQTLs measured within eight brain cell types
        <Cite k="bryois2022" />, recovering effects that bulk tissue averages
        away.
      </>
    ),
  },
  {
    channel: "fetal_eqtl",
    name: "Fetal eQTL",
    note: (
      <>
        eQTLs from developing cortex
        <Cite k="walker2019" />, testing whether risk variants act during
        development rather than in adult tissue.
      </>
    ),
  },
  {
    channel: "splicing",
    name: "Splicing",
    note: (
      <>
        <Term k="sqtl">Splicing QTLs</Term> from 17 datasets, catching variants
        that change transcript form without changing total expression.
      </>
    ),
  },
  {
    channel: "methylation",
    name: "Methylation",
    note: (
      <>
        Brain <Term k="mqtl">methylation QTLs</Term> from roughly 1,160 brains
        <Cite k="qi2018" />, a readout of regulatory activity that does not
        require knowing the target gene.
      </>
    ),
  },
];

export default function GuidePage() {
  const led = Object.fromEntries(
    summary.ledger.map((e) => [e.channel, e.newly_explained]),
  );
  const explained = summary.nLoci - summary.nUnexplained;
  const pctBulk = Math.round(
    summary.stage1Fractions.any_brain.fraction * 100,
  );
  const pctExplained = Math.round((explained / summary.nLoci) * 100);
  const pctUnexplained = Math.round(
    (summary.nUnexplained / summary.nLoci) * 100,
  );

  return (
    <div className="max-w-3xl">
      <p className="kicker !text-[var(--gold)]">Start here</p>
      <h1 className="mt-1 font-display text-3xl leading-tight">
        A reader&rsquo;s guide to this study
      </h1>
      <p className="mt-3 text-sm font-light leading-6 text-[var(--ink-dim)]">
        This site reports one focused investigation: whether the DNA variants
        that raise schizophrenia risk work by changing gene regulation in the
        brain, and how much of that regulation today&rsquo;s public molecular
        data can actually see. This page builds the background a section at a
        time. Dotted-underlined words open definitions anywhere on the site,
        and the <Link className="lnk" href="/glossary/">glossary</Link> holds
        the full index.
      </p>

      <Section n={1} title="The question in one paragraph">
        <p>
          Schizophrenia runs strongly in families, and large genetic studies
          have traced part of that heritability to hundreds of specific
          regions of the genome. Almost none of those regions contain a
          protein-breaking mutation. The standard explanation is that the
          risk variants instead adjust how strongly nearby genes are switched
          on or off in the brain. If that explanation is right, risk variants
          should coincide with variants already known to change gene activity
          in brain tissue. Mostly, they do not. That mismatch has been called
          the missing regulation problem
          <Cite k="connally2022" />, and this project measures it, tests
          explanations for it, and asks which kind of molecular evidence
          closes the gap.
        </p>
      </Section>

      <Section n={2} title="From DNA differences to risk regions">
        <p>
          A <Term k="gwas">genome-wide association study</Term> compares the
          genomes of people with and without a condition at millions of{" "}
          <Term k="variant">variants</Term>, single positions where DNA
          differs between people, and flags the variants that are reliably
          more common in one group. The schizophrenia study used here,{" "}
          <Term k="pgc3">PGC3</Term>
          <Cite k="trubetskoy2022" />, compared 67,390 people with
          schizophrenia against 94,015 without and reported 287 significant
          regions; 281 of them are analyzable and appear on this site.
        </p>
        <p>
          Each region, or <Term k="locus">locus</Term>, is a stretch of DNA
          containing many variants that travel together through generations
          because they are inherited as a block. That correlation, called{" "}
          <Term k="ld">linkage disequilibrium</Term>, means a GWAS can say a
          region matters but usually cannot say which single variant is
          responsible, and the flagged{" "}
          <Term k="index-variant">index variant</Term> is best read as a
          bookmark. A locus typically spans several genes, so the question
          &ldquo;which gene does this locus act through?&rdquo; has no
          automatic answer.
        </p>
      </Section>

      <Section n={3} title="Why regulation is the default suspect">
        <p>
          The large majority of risk variants are{" "}
          <Term k="regulatory-variant">non-coding</Term>: they sit outside
          the parts of genes that specify proteins, so they cannot change a
          protein&rsquo;s composition. What they can plausibly change is{" "}
          <Term k="expression">gene expression</Term>, the amount of RNA a
          gene produces. Genetics has a tool for finding such effects: an{" "}
          <Term k="eqtl">eQTL</Term> is a variant associated with the
          expression level of a nearby gene, measured across hundreds of
          donated tissue samples. Public brain eQTL catalogs
          <Cite k="gtex2020" />
          <Cite k="kerimov2021" />
          <Cite k="deklein2023" /> cover 14 adult brain datasets used here,
          from 13 GTEx regions to the MetaBrain cortex meta-analysis of
          roughly 2,700 effective samples.
        </p>
      </Section>

      <Section n={4} title="The test: do two signals share one cause?">
        <p>
          Finding a risk variant and an eQTL in the same region is not
          enough, because <Term k="ld">LD</Term> makes coincidental overlap
          common. <Term k="colocalization">Colocalization</Term>
          <Cite k="giambartolomei2014" /> compares the full shape of the two
          association signals and asks which is more likely: one shared
          causal variant driving both, or two distinct variants that happen
          to be neighbors. The answer arrives as posterior probabilities, and
          the one that matters here is <Term k="pp4">PP4</Term>, the
          probability of a shared causal variant. This site counts a result
          as colocalized when PP4 exceeds 0.8.
        </p>
        <p>
          One caution applies everywhere on this site: colocalization is
          evidence that two signals share a cause, not proof that the
          molecular trait carries the disease effect. A shared variant might
          influence the disease through some other route entirely.
        </p>
      </Section>

      <Section n={5} title="The gap, measured">
        <p>
          Applied to all 281 loci and all 14 bulk brain expression datasets,
          the direct test succeeds at {led.bulk_expression} loci, or{" "}
          {pctBulk}%. The failures are not explained by an absence of eQTLs:
          94% of the non-colocalizing loci harbor a strong eQTL for some gene
          nearby, but the eQTL and the risk signal favor different variants.
          Larger eQTL studies help, roughly 2.5-fold higher odds of
          colocalization per tenfold increase in sample size, yet the trend
          flattens near 25% for single cortex datasets, so more of the same
          data will not close the gap on its own.
        </p>
      </Section>

      <Section n={6} title="Six kinds of evidence, applied in order">
        <p>
          The project then widens the search beyond adult bulk expression.
          Six evidence channels are applied in a fixed order, from the most
          direct to the most indirect, and each locus is credited to the
          first channel that explains it. This{" "}
          <Term k="attribution">sequential attribution</Term> is what the
          waterfall figure on the dashboard shows.
        </p>
        <ul className="space-y-2.5">
          {CHANNEL_NOTES.map((c, i) => (
            <li key={c.channel} className="flex gap-3">
              <span className="w-9 shrink-0 text-right font-medium tabular-nums text-[var(--gold-bright)]">
                {led[c.channel]}
              </span>
              <span>
                <span className="font-normal text-[var(--ink)]">
                  {i + 1}. {c.name}.
                </span>{" "}
                {c.note}
              </span>
            </li>
          ))}
        </ul>
        <p>
          The counts above are loci newly explained by each channel. The
          expression-based channels together account for{" "}
          {led.bulk_expression +
            led.susie_rescue +
            led.single_cell +
            led.fetal_eqtl +
            led.splicing}{" "}
          loci. Methylation, tested last, adds {led.methylation} more, the
          largest single contribution; tested on its own it colocalizes at
          193 of 281 loci, including 118 of the 191 loci that bulk expression
          missed, and its per-test success rate is six times that of
          expression. The final tally is {explained} of {summary.nLoci} loci
          explained ({pctExplained}%), leaving {summary.nUnexplained} (
          {pctUnexplained}%) unexplained by every channel. For loci with no
          expression evidence at all, a two-step{" "}
          <Term k="methylation-chain">methylation chain</Term> nominates
          candidate genes; {summary.nominations.orphanHigh} such loci
          received a high-tier nomination.
        </p>
      </Section>

      <Section n={7} title="What to conclude, and what not to">
        <Takeaways
          yes={[
            <>
              Most schizophrenia risk loci cannot be tied to a gene through
              adult bulk brain eQTLs at strict thresholds; expression data of
              all kinds explain roughly half of the loci.
            </>,
            <>
              The regulatory hypothesis itself holds up: brain methylation
              QTLs colocalize at most loci, placing the risk variants on
              active regulatory DNA even where expression data are silent.
            </>,
            <>
              The shortfall lies mostly with current expression catalogs,
              their sample sizes, tissues, cell types, and developmental
              windows, rather than with the idea that these variants are
              regulatory.
            </>,
            <>
              For {summary.nominations.orphanHigh} expression-orphan loci,
              the methylation chain supplies specific, testable gene
              nominations.
            </>,
          ]}
          no={[
            <>
              Colocalization does not prove causation. A shared variant links
              two signals; it does not show that the molecular trait
              transmits the disease effect.
            </>,
            <>
              A methylation link does not establish mechanism or direction;
              methylation may mediate the effect, respond to it, or simply
              mark the same regulatory element.
            </>,
            <>
              Nominated genes are hypotheses for functional follow-up, not
              confirmed schizophrenia genes.
            </>,
            <>
              The {summary.nUnexplained} unexplained loci are not evidence of
              absent regulatory function; contexts this project could not
              measure, such as specific developmental windows or rare cell
              states, remain untested.
            </>,
          ]}
        />
      </Section>

      <Section n={8} title="How to explore this site">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            The <Link className="lnk" href="/">dashboard</Link> holds the
            headline figures: the waterfall of sequential attribution, the
            evidence matrix, and the full locus table. Click a waterfall bar
            to filter everything else to those loci.
          </li>
          <li>
            Every locus links to its own evidence card with per-channel PP4
            values, fine-mapping annotations, and any chained gene
            nominations.
          </li>
          <li>
            The{" "}
            <Link className="lnk" href="/nominations/">
              gene nominations
            </Link>{" "}
            page lists every chained candidate with both link strengths and
            filters for tier, orphan status, and CpG distance.
          </li>
          <li>
            The{" "}
            <Link className="lnk" href="/regional/">
              regional plots
            </Link>{" "}
            page shows three worked examples, including the FURIN positive
            control, at the level of individual variants.
          </li>
          <li>
            The <Link className="lnk" href="/about/">about page</Link> lists
            data sources, methods, references, and the repository that
            regenerates every number shown here.
          </li>
        </ul>
        <p className="pt-1">
          Each figure and table carries its own &ldquo;How to read
          this&rdquo; panel, and every dotted-underlined term opens a
          definition. The full list lives in the{" "}
          <Link className="lnk" href="/glossary/">glossary</Link>.
        </p>
      </Section>
    </div>
  );
}
