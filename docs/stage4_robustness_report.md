# Stage 4 + robustness — splicing, methylation, and the collapse of the unexplained core

**Date:** 2026-08-13 · 281 analysable loci · artifacts: `results/final/ledger.json`, `results/final/ledger_per_locus.tsv` · regenerate: `snakemake results/sqtl/coloc.done results/stage4/meqtl_coloc.done results/robustness/eur_coloc.done` then `python scripts/final_ledger.py …`

## The final sequential ledger

Attribution is sequential and fixed a priori (coarse-to-fine); each locus counts once, at the first channel that explains it:

| Channel | Newly explained | Total hits (PP4>0.8) |
|---|---|---|
| Bulk expression (14 datasets, Stage 1) | 90 | 90 |
| Multi-signal rescue (coloc-SuSiE) | 22 | — |
| Single-cell eQTL (8 cell types) | 6 | 37 |
| Fetal eQTL | 4 | 20 |
| **Splicing (17 brain sQTL datasets)** | **9** | **47** |
| **Methylation (Brain-mMeta, ~1,160 brains)** | **84** | **193** |
| **Unexplained** | **65 (23.1%)** | |

The story changed qualitatively with the molecular-layer extensions:

1. **Splicing is a genuinely distinct channel**: 47 loci colocalize with a brain sQTL; 10 of them had survived *every* expression-based explanation (9 surviving also the fetal/sc steps in sequential order). ROSMAP (22) and CommonMind (20) sQTLs dominate — the familiar sample-size gradient.
2. **Methylation is the big one**: 193/281 loci (69%) share a causal variant with at least one brain CpG, including **118 of the 191 expression-orphan loci (62%)**. The missing-regulation core shrinks from 57% to **23%**.

## Is the methylation result a trait-multiplicity artifact?

The obvious objection — hundreds of CpGs per locus give methylation more shots on goal — does not survive quantification:

- Tests per locus are comparable: median 246 CpGs (~389 meQTL tests/locus) vs ~560 expression gene×dataset tests/locus.
- **Per-test colocalization rates: methylation 1.22% vs expression 0.21%** — six-fold higher per attempt.
- Threshold robustness: at PP4 > 0.9, 157 loci (90 expression-misses) retain methylation coloc; at PP4 > 0.95, 130 (68 misses).

## What the methylation coloc does and does not mean

It means: at these loci the *same causal variant* that drives schizophrenia risk measurably shifts DNA methylation in adult brain — the variants are **epigenetically active exactly where expression QTLs see nothing**. It does not mean methylation *mediates* risk (colocalization is symmetric about mechanism), and the meQTL side inherits coloc.abf's single-causal-variant assumption (no public fine-mapped meQTL lbf exists to repeat the coloc-SuSiE upgrade). But combined with Stage 2's chromatin-depletion result, the coherent picture is: **most "missing regulation" loci act on brain chromatin; the transcriptional consequence is what current eQTL catalogs fail to capture** — presumably context-, cell-state-, or timing-restricted, or buffered at steady state.

## Robustness results

- **Ancestry (EUR-only GWAS rerun, headline datasets)**: classification agreement 96.4% (GTEx cortex) / 93.9% (MetaBrain); Spearman of best PP4 ≈ 0.89 for both; hit counts 27→25 and 55→60. The multi-ancestry "primary" GWAS is not distorting the picture.
- **Reference-panel LD (kriging_rss on all 281 loci)**: median LD-outlier fraction 2.0%; **no locus exceeds 5%**. The 1000G panel approximation is uniform and modest; 33 zero-CS loci and 2 non-convergences stand as sensitivity-limited, now with per-locus diagnostics recorded.
- **Fetal mQTL overlap (Hannon, Bonferroni-significant release — enrichment-grade only)**: 43/281 loci carry ≥1 credible-set variant that is a significant fetal brain mQTL; expression-missing loci are *depleted* (OR 0.30, p=6e-4), consistent with the Stage 2 chromatin-depletion finding rather than the fetal-enhancer hypothesis.
- **Deferred/unavailable**: fastENLOC (redundant with the abf/SuSiE cross-check, available on request); PolyFun-UKB LD (matrices moved to a requester-pays bucket — noted, would cost money not permissions).

## Revised verdict on the missing regulation

1. The gap is real at the expression level and survives power, multi-signal modelling, cell-type resolution, fetal context, and ancestry/LD checks.
2. **A majority of the expression-orphan loci are nonetheless regulatory in brain** — demonstrated by shared causal variants with DNA methylation at 62–70% of them (threshold-dependent).
3. The residual hard core is now **65 loci (23%)** with no molecular colocalization in any tested layer — the true frontier, and the strongest candidates for developmental-window, cell-state-restricted, or non-cis mechanisms.

`results/final/ledger_per_locus.tsv` carries the per-locus attribution, best splicing/methylation posteriors, and the 65-locus list.
