# Stage 0 — Feasibility Audit

**Project:** Fine-mapping and the "missing regulation" puzzle in schizophrenia GWAS
**Date:** 2026-08-11 · **Verdict: GO**, with four caveats (see [§6](#6-risks-and-open-questions)).
All access checks, sizes, versions, and timings below were **empirically verified today** from this machine, not quoted from documentation.

---

## 1. Machine reality check

| Spec | Value | Implication |
|---|---|---|
| CPU | 16 cores | Fine for parallel loci |
| **RAM** | **15.6 GB total (~12 GB in use at audit time)** | ⚠️ The project brief said 64 GB. `free -h` reports 15 GiB. This caps concurrent SuSiE/LD jobs at ~2–4 (an 8k-SNP LD matrix ≈ 0.5 GB as float64). Workable, but big runs need other apps closed — or the brief referred to a different machine. **Please confirm.** |
| Disk | 175 GB free / 458 GB | Hybrid data strategy peaks at ~85 GB → OK |
| GPU | RTX 3070 Laptop 8 GB | Not needed for this pipeline |
| conda | 26.1.1, libmamba solver | Fast solves; no mamba needed |

## 2. Data resources — access verified

| # | Resource | Access | Size (verified) | Build | Notes |
|---|---|---|---|---|---|
| 1 | **PGC3 SCZ** (Trubetskoy 2022), figshare article [19426775](https://doi.org/10.6084/m9.figshare.19426775) v7 | ✅ anonymous, streams | primary autosomes **236 MB**; EUR-only 240 MB; core 443 MB; chrX 7.6 MB; README pdf | GRCh37 | PGC-VCF format. Header confirms NCAS=67,390 / NCON=94,015, per-SNP NEFF column. File is **not position-sorted** → sort + bgzip + tabix on ingest. |
| 2 | **GTEx v8 brain eQTL** via **eQTL Catalogue** (study QTS000015) | ✅ **remote tabix over HTTPS works** | 13 brain datasets; `*.all.tsv.gz` ≈ 3.5 GB each but **no full download needed**: a 2 Mb region query returned 129,411 rows in **6.6 s** | GRCh38 | Includes **precomputed SuSiE outputs per dataset**: `credible_sets.tsv.gz` (~2 MB) and `lbf_variable.txt.gz` (~0.9 GB) → coloc.susie on the eQTL side *without* genotype LD. Datasets QTD000146–QTD000206 (amygdala…substantia nigra), cortex = QTD000171 (N=205), DLPFC = QTD000176 (N=175). |
| 2b | GTEx portal GCS bucket (`adult-gtex`) | ✅ | significant-pairs tars only: all-pop 1.56 GB, EUR 2.14 GB | GRCh38 | The all-SNP-gene-associations directory on the public bucket is an **empty placeholder** — full nominal stats are effectively served via eQTL Catalogue. |
| 3 | **MetaBrain** 2020-05-26 cortex-EUR | ✅ download.metabrain.nl | **25.2 GB** total (22 per-chr files; chr1 = 2.4 GB, chr22 = 0.6 GB) | **GRCh38** (verified: chr22 positions < 16 Mb) | Not tabix-indexed → full download + local recompress/index. Per-SNP meta N in file (AMP-AD MAYO/MSBB/ROSMAP + more). Betas/SEs are *derived from Z + allele frequency* per their column description — fine for coloc, must be documented. |
| 4 | **PsychENCODE** (resource.psychencode.org) | ✅ | Full cis-eQTL 3.29 GB; DER-08a significant 376 MB; DER-10a isoQTL 391 MB | **hg19** | Adult DLPFC (n≈1,387). Needs liftover or rsID matching. |
| 5 | **Bryois 2022 sc-eQTL** (8 brain cell types), Zenodo [7276971](https://zenodo.org/records/7276971) | ✅ | 200 files, 5–40 MB each (~3–4 GB total) | verify on ingest | For Stage 2c (cell-type dilution). Column format/SE availability to be checked at ingest. |
| 6 | **Fetal brain eQTL** — Walker 2019 neocortex, eQTL Catalogue QTD000579 (N=211) | ✅ remote tabix | region queries only | GRCh38 | Bonus for Stage 2d — direct fetal-vs-adult coloc comparison, same format as GTEx. |
| 7 | Extra adult DLPFC power ladder (Stage 2b): BrainSeq N=479, CommonMind N=586, ROSMAP N=560 — all eQTL Catalogue | ✅ remote tabix | region queries only | GRCh38 | eQTL N range 114→586 within one format → clean power analysis. |
| 8 | **1000G LD reference** | ✅ EBI FTP | GRCh38 high-coverage phased chr22 = 446 MB (autosomes est. 15–20 GB); GRCh37 phase3 chr22 = 206 MB | both | Recommend GRCh38 NYGC phased panel → EUR unrelated (n≈503) → plink2 → per-locus LD. ⚠️ The CTG/MAGMA `g1000_eur.zip` shortcut link is dead (returns an HTML page). |
| 9 | **Fetal brain chromatin** — Roadmap chromHMM E081/E082 | ✅ egg2.wustl.edu | 2.1 + 2.4 MB | hg19 (hg38lift versions exist) | Stage 2d annotation. Can add fetal ATAC (e.g. Markenscoff-Papadimitriou 2020) later. |
| 10 | **287-locus definitions** — Trubetskoy supplementary tables (Springer) | ✅ **only with a browser User-Agent** (plain curl → 403) | supp zip ≈ 29 MB | — | Pin the file + SHA256 in the repo. Fallback: derive loci by LD clumping of the sumstats. Extended-Data-Table1.xlsx also on the figshare record. |

## 3. Tool audit — fresh conda env

Env `scz-coloc-audit` created from scratch (conda-forge + bioconda, ~2.3 GB, lockfile at `envs/scz-coloc-audit.lock.yml`). All smoke tests **pass**:

| Tool | Version | Install route | Smoke test |
|---|---|---|---|
| susieR | **0.14.2** | conda-forge `r-susier` | recovered 2/2 planted signals (L1, L2) on simulated data |
| coloc | **5.2.3** | conda-forge `r-coloc` | `coloc.abf` on packaged test data → PP4 = 0.999; `coloc.susie` present |
| FINEMAP | **1.4.2** | binary from christianbenner.com (2.2 MB) — *not redistributable; academic license; not on conda* | runs, prints banner |
| PolyFun | **1.0.0** | git clone + its own `polyfun.yml` env (pins Python 3.8 and r-susier 0.11.92 → **must stay a separate env**) | `polyfun.py --help`, `finemapper.py --help` OK |
| fastENLOC | **3.1** (Nov 2024) | **not on bioconda** → source build; needs GSL: `make CCFLAGS="-O3 -I$CONDA_PREFIX/include" LIBS="-L$CONDA_PREFIX/lib -Wl,-rpath,$CONDA_PREFIX/lib -lm -lgsl -lgslcblas -lz"` | builds clean with conda GSL, runs |
| Support stack | R 4.3.3 · Python 3.11.15 · snakemake 9.25.1 · htslib/tabix 1.24 · bcftools 1.24 · plink 1.9 · plink2 2.0.0-a.6.9 | one env | all respond |

## 4. Disk and runtime estimates (~287 loci)

**Recommended hybrid data strategy** — mirror only what can't be range-queried:

| Component | On disk |
|---|---|
| PGC3 sumstats (primary + EUR) + sorted/indexed copies | ~2 GB |
| GTEx (13 brain) + fetal + DLPFC ladder: cached per-locus region extracts + credible sets | ~4–6 GB |
| GTEx lbf files for 2–3 key tissues (optional, for coloc-SuSiE) | 2–3 GB |
| MetaBrain cortex-EUR (full, unavoidable) | 25 GB (+~10 GB re-indexed) |
| PsychENCODE full + isoQTL | ~4.1 GB |
| Bryois sc-eQTL | ~3.5 GB |
| 1000G GRCh38 → EUR plink subset (VCFs deletable after conversion) | ~20 GB transient, ~6 GB kept |
| LD matrices cache (287 loci × ~0.5 GB, pruned as we go) + results | ~15 GB |
| **Peak total** | **~85 GB** (fits in 175 GB free) |

**Runtime** (16 cores; RAM caps heavy R jobs at ~3–4 workers):

| Step | Estimate |
|---|---|
| Downloads (MetaBrain 25 GB is the long pole) | 1–3 h, bandwidth-dependent |
| Region extraction, remote tabix: 287 loci × ~17 datasets ≈ 4.9k queries × 6.6 s | ~9 h serial → **~1.5 h at 8 streams** |
| coloc.abf: ~10⁵ locus–gene–tissue tests (~ms each) | < 1 h |
| GWAS-side SuSiE: per-locus LD (plink2) + `susie_rss` | ~2–3 h at 3–4 workers |
| FINEMAP over same loci | similar |
| coloc-SuSiE + fastENLOC | < 2 h |
| PolyFun (optional, UKB LD priors) | +55 GB transient download; add ~1 day; defer unless needed |
| **Stage 1 wall clock** | **~half a day** |
| **Stage 2 wall clock** | **~1 day** |

## 5. Design decisions proposed (ratify before Stage 1)

1. **GRCh38 as the pipeline build.** GTEx/eQTL Catalogue/MetaBrain/fetal are already GRCh38; lift PGC3 (hg19) once via UCSC liftOver + rsID cross-check; lift PsychENCODE and Roadmap the same way.
2. **eQTL Catalogue as canonical GTEx access** (remote tabix + precomputed SuSiE credible sets/lBFs) instead of mirroring all-pairs files. Every extracted region is cached to disk, so downstream results remain reproducible offline.
3. **LD panel:** 1000G GRCh38 high-coverage EUR (n≈503). Known limitation: reference LD for an N≈161k meta-analysis is the main methodological risk (see §6).
4. **Locus definitions:** Trubetskoy Supplementary Table 3 (287 loci), file SHA256-pinned; clumping-derived loci as sensitivity check.
5. **Power ladder for Stage 2b:** GTEx brain (N=114–209) → BrainSeq (479) → ROSMAP (560) → CommonMind (586) → MetaBrain meta (N per-SNP up to ~6k) — all same-format sources.
6. Orchestration: **Snakemake** (9.25.1 already in env), config-driven paths in `config/config.yaml`, two pinned envs (`scz-coloc-audit` + `polyfun`).

## 6. Risks and open questions

1. **RAM discrepancy** — 15.6 GB measured vs 64 GB in the brief. Pipeline is planned around 15.6 GB (3–4 concurrent heavy jobs). If a 64 GB machine exists, parallelism scales up trivially.
2. **Reference-panel LD mismatch** (1000G n=503 vs PGC3 meta cohorts) can produce spurious SuSiE credible sets on the GWAS side. Mitigations: `susie_rss` diagnostic (`estimate_residual_variance`, lambda check), flag non-converging loci, optional PolyFun/UKB-LD sensitivity arm, and coloc.abf (LD-free) always reported alongside.
3. **MetaBrain betas/SEs are Z-derived**, not primary regression estimates (their own documentation) — acceptable for coloc, but the report must state it.
4. **eQTL Catalogue etiquette/rate limits** unknown — cap at ~8 concurrent streams, cache everything, never re-query in CI.
5. Minor: FINEMAP binary can't be committed (license) — Snakemake rule downloads + checksums it; Springer supp needs a browser UA header in the download rule; Bryois file format/SE availability verified at ingest.

## 7. What Stage 1 will build (preview, for review)

- `workflow/Snakefile` rules: `download_*` → `harmonize_gwas` → `extract_locus_regions` → `run_coloc_abf` → `per_locus_table` → `summary_figure`.
- Primary Stage 1 deliverable: per-locus table (287 rows × best PP4 per dataset class) + fraction of loci with PP4 > 0.8 for ≥1 brain eQTL, GTEx cortex vs MetaBrain cortex side by side.

**STOPPED here per instructions — awaiting review of this audit before building Stage 1.**
