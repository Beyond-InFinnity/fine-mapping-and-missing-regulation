# Fine-mapping and the missing regulation

Exploratory research pipeline on the variant-to-gene gap in schizophrenia GWAS:
why do PGC3 SCZ loci colocalize with brain eQTLs less often than expected?

Everything runs on **public summary statistics** — no controlled data.

## Headline findings

Across 281 analysable PGC3 SCZ loci (PP4 > 0.8 throughout):

- Only **9.6%** colocalize with GTEx cortex eQTLs; **32%** with any of 14 bulk
  brain expression datasets — the "missing regulation" gap replicates.
- eQTL power scales colocalization (OR 2.5 per 10× N) but saturates ≈25%;
  multi-signal coloc-SuSiE reclassifies ~26% of single-variant calls in
  *both* directions; heterogeneity is not enriched among misses.
- Splicing QTLs add 47 loci; **brain methylation (Brain-mMeta meQTL,
  n≈1,160) colocalizes at 193/281 loci — including 118 of the 191
  expression-orphan loci** (6× the per-test rate of expression; robust to
  PP4 > 0.95). The unexplained core shrinks from 57% to **23% (65 loci)**.
- Interpretation: most "missing regulation" loci are epigenetically active
  in adult brain; current eQTL catalogs miss the transcriptional readout,
  not the regulation. A meQTL→eQTL transitive chain nominates target genes
  for the methylation-explained loci.

Full narrative: `report/report.qmd` (rendered HTML self-contained) and the
staged reports in `docs/`.

## Stages

- **Stage 0 — Feasibility audit** ([docs/stage0_audit.md](docs/stage0_audit.md)) ✅
- **Stage 1 — Replication baseline** ([docs/stage1_report.md](docs/stage1_report.md)) ✅ — 32% of 281 loci colocalize with ≥1 of 14 brain eQTL datasets
- **Stage 2 — Dissecting the miss** ([docs/stage2_report.md](docs/stage2_report.md)) ✅ — power/heterogeneity/cell-type/fetal ledger; 57% remain unexplained
- **Stage 3 — Writeup** ([report/report.qmd](report/report.qmd) → `quarto render`) ✅ — self-contained HTML, every number computed from results files

Caveat for reruns: Snakemake tracks rule shell strings, not the external
scripts they call — after editing a `scripts/*.py|R` file, force downstream
regeneration with `--forcerun <rule>`.

## Environments

- `envs/scz-coloc-audit.lock.yml` — main env (R 4.3.3, susieR 0.14.2, coloc 5.2.3, snakemake 9.25.1, htslib, plink/plink2, bcftools)
- PolyFun runs in its own pinned env (`polyfun.yml` from the upstream repo; Python 3.8)
- FINEMAP 1.4.2 and fastENLOC 3.1 are fetched/built by pipeline rules (licenses prevent vendoring)

## Layout

```
config/    config-driven paths and parameters
docs/      audit + design notes
envs/      pinned conda environments
scripts/   analysis scripts called by workflow rules
workflow/  Snakemake pipeline
```
