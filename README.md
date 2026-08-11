# Fine-mapping and the missing regulation

Exploratory research pipeline on the variant-to-gene gap in schizophrenia GWAS:
why do PGC3 SCZ loci colocalize with brain eQTLs less often than expected?

Everything runs on **public summary statistics** — no controlled data.

## Stages

- **Stage 0 — Feasibility audit** ([docs/stage0_audit.md](docs/stage0_audit.md)) ✅ done, awaiting review
- **Stage 1 — Replication baseline**: fraction of PGC3 loci with PP4 > 0.8 vs ≥1 brain eQTL (GTEx cortex vs MetaBrain)
- **Stage 2 — Dissecting the miss**: allelic heterogeneity (coloc-SuSiE) · eQTL power · cell-type dilution · fetal-specific regulation
- **Stage 3 — Writeup**: reproducible report ranking explanations by evidence

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
