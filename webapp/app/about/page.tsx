import Cite from "@/components/Cite";
import Term from "@/components/Term";
import { Takeaways } from "@/components/Explainer";
import { REFERENCES } from "@/lib/references";

export default function AboutPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl">About this project</h1>
      <p className="mt-3 text-sm leading-6 text-[var(--ink-dim)]">
        Most schizophrenia GWAS loci are non-coding and presumed regulatory,
        yet only a minority colocalize with brain expression QTLs, a
        discrepancy known as the missing regulation problem
        <Cite k="connally2022" />. This project quantifies the discrepancy on
        281 PGC3 loci and tests six candidate explanations within one
        reproducible pipeline built entirely on public{" "}
        <Term k="summary-statistics">summary statistics</Term>.
      </p>
      <p className="mt-3 text-sm leading-6 text-[var(--ink-dim)]">
        The headline findings: 32% of loci colocalize with at least one of 14
        bulk brain expression datasets; eQTL sample size helps but saturates
        near 25% for single cortex datasets; fine-mapping reclassifies about
        a quarter of single-variant colocalization calls in each direction;
        single-cell, fetal, and splicing QTLs add a further 19 loci; and
        brain DNA methylation QTLs colocalize at 193 of 281 loci, including
        118 of the 191 loci with no expression colocalization. Sixty-five
        loci (23%) remain unexplained by every channel. A transitive
        methylation-to-expression chain nominates candidate genes at 44 loci
        that lack direct eQTL support.
      </p>

      <h2 className="mt-6 kicker !text-[var(--gold)]">
        What we conclude, and what we do not
      </h2>
      <div className="mt-2">
        <Takeaways
          yes={[
            <>
              Adult bulk brain eQTLs anchor a minority of schizophrenia risk
              loci; the widely reported variant-to-gene gap replicates here
              at 32%.
            </>,
            <>
              Brain methylation QTLs colocalize at 69% of loci, so most risk
              variants without expression evidence are nonetheless active on
              brain regulatory DNA.
            </>,
            <>
              The shortfall therefore lies mostly with current expression
              catalogs, not with the regulatory hypothesis itself.
            </>,
            <>
              The methylation chain converts that observation into specific,
              testable gene nominations at 44 expression-orphan loci.
            </>,
          ]}
          no={[
            <>
              Colocalization demonstrates a shared causal variant, not
              causation; none of these results proves that a molecular trait
              transmits the disease effect.
            </>,
            <>
              Methylation links carry no direction or mechanism; mediation is
              one possibility among several.
            </>,
            <>
              Nominated genes are hypotheses for functional follow-up, not
              confirmed schizophrenia genes.
            </>,
            <>
              Unexplained loci may act in developmental windows, cell states,
              or modalities that public data do not yet cover.
            </>,
          ]}
        />
      </div>

      <h2 className="mt-6 kicker !text-[var(--gold)]">Data sources</h2>
      <ul className="mt-2 list-disc pl-5 text-sm leading-6 text-[var(--ink-dim)]">
        <li>
          PGC3 schizophrenia GWAS (Trubetskoy et al. 2022)
          <Cite k="trubetskoy2022" />
        </li>
        <li>
          GTEx v8 brain eQTLs and sQTLs via the eQTL Catalogue
          <Cite k="gtex2020" />
          <Cite k="kerimov2021" />
        </li>
        <li>
          MetaBrain cortex-EUR eQTL meta-analysis (de Klein et al. 2023)
          <Cite k="deklein2023" />
        </li>
        <li>
          BrainSeq, CommonMind, ROSMAP DLPFC eQTLs/sQTLs
          <Cite k="kerimov2021" />
        </li>
        <li>
          Single-cell eQTLs, 8 brain cell types (Bryois et al. 2022)
          <Cite k="bryois2022" />
        </li>
        <li>
          Fetal neocortex eQTLs (Walker et al. 2019)
          <Cite k="walker2019" />
        </li>
        <li>
          Brain-mMeta methylation QTLs (Qi et al. 2018)
          <Cite k="qi2018" />
        </li>
        <li>
          Fetal brain mQTLs (Hannon et al. 2016)
          <Cite k="hannon2016" />
        </li>
        <li>
          Roadmap chromHMM segmentations
          <Cite k="roadmap2015" />; 1000 Genomes GRCh38 EUR LD panel
          <Cite k="byrska2022" />
        </li>
      </ul>

      <h2 className="mt-6 kicker !text-[var(--gold)]">Methods in brief</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--ink-dim)]">
        Colocalization uses coloc.abf
        <Cite k="giambartolomei2014" /> with default priors over ±1 Mb
        windows around each index variant; multi-signal analysis uses SuSiE
        fine-mapping of the GWAS
        <Cite k="wang2020" />
        <Cite k="zou2022" /> paired with published per-gene SuSiE results via
        coloc.bf_bf
        <Cite k="wallace2021" />; the methylation chain scores each gene by
        the weaker link of GWAS↔CpG and CpG↔gene colocalization. The full
        Snakemake
        <Cite k="molder2021" /> pipeline, configuration, reports, and
        manuscript draft are in the repository; every number on this site
        regenerates from raw public downloads.
      </p>

      <h2 className="mt-6 kicker !text-[var(--gold)]">References</h2>
      <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-[13px] font-light leading-5 text-[var(--ink-dim)]">
        {REFERENCES.map((r) => (
          <li key={r.key}>
            {r.authors} ({r.year}). {r.title}. <i>{r.journal}</i>.{" "}
            <a
              className="lnk"
              href={`https://doi.org/${r.doi}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              doi:{r.doi}
            </a>
          </li>
        ))}
      </ol>

      <p className="mt-6 text-sm">
        <a
          className="lnk"
          href="https://github.com/Beyond-InFinnity/fine-mapping-and-missing-regulation"
          target="_blank"
          rel="noopener noreferrer"
        >
          github.com/Beyond-InFinnity/fine-mapping-and-missing-regulation ↗
        </a>
      </p>
    </div>
  );
}
