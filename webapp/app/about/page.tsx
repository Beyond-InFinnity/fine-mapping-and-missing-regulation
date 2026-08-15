export default function AboutPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl">About this project</h1>
      <p className="mt-3 text-sm leading-6 text-[var(--ink-dim)]">
        Most schizophrenia GWAS loci are non-coding and presumed regulatory,
        yet only a minority colocalize with brain expression QTLs, a
        discrepancy known as the missing regulation problem. This project
        quantifies the discrepancy on 281 PGC3 loci and tests six candidate
        explanations within one reproducible pipeline built entirely on
        public summary statistics.
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
      <h2 className="mt-6 kicker !text-[var(--gold)]">Data sources</h2>
      <ul className="mt-2 list-disc pl-5 text-sm leading-6 text-[var(--ink-dim)]">
        <li>PGC3 schizophrenia GWAS (Trubetskoy et al. 2022)</li>
        <li>GTEx v8 brain eQTLs and sQTLs via the eQTL Catalogue</li>
        <li>MetaBrain cortex-EUR eQTL meta-analysis (de Klein et al. 2023)</li>
        <li>BrainSeq, CommonMind, ROSMAP DLPFC eQTLs/sQTLs</li>
        <li>Single-cell eQTLs, 8 brain cell types (Bryois et al. 2022)</li>
        <li>Fetal neocortex eQTLs (Walker et al. 2019)</li>
        <li>Brain-mMeta methylation QTLs (Qi et al. 2018)</li>
        <li>Fetal brain mQTLs (Hannon et al. 2016)</li>
        <li>Roadmap chromHMM segmentations; 1000 Genomes GRCh38 EUR LD panel</li>
      </ul>
      <h2 className="mt-6 kicker !text-[var(--gold)]">Methods in brief</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--ink-dim)]">
        Colocalization uses coloc.abf with default priors over ±1 Mb windows
        around each index variant; multi-signal analysis uses SuSiE
        fine-mapping of the GWAS paired with published per-gene SuSiE results
        via coloc.bf_bf; the methylation chain scores each gene by the weaker
        link of GWAS↔CpG and CpG↔gene colocalization. The full Snakemake
        pipeline, configuration, reports, and manuscript draft are in the
        repository; every number on this site regenerates from raw public
        downloads.
      </p>
      <p className="mt-4 text-sm">
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
