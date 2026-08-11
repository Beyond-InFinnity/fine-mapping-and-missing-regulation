#!/usr/bin/env Rscript
# Colocalization of one GWAS locus against all genes of one eQTL dataset.
#
# GWAS side: PGC3 SCZ (case-control), beta/varbeta from the harmonized file.
# eQTL side, two source types sharing all downstream logic:
#   eqtl_catalogue : beta/se/MAF in file, N from dataset registry
#   metabrain      : Z/p + per-SNP N in file, no allele frequency published;
#                    MAF is taken from PGC3 control frequency of the matched
#                    variant (EUR-dominated; documented approximation).
#
# Variants are matched across datasets on GRCh38 chrom:pos:{allele pair},
# alleles sorted lexicographically (PP4 is invariant to effect direction,
# so sign alignment is deferred to Stage 2 effect-direction analyses).
#
# Per-gene results are emitted for every gene with any data in the region;
# genes that cannot be tested get an explicit status instead of being
# silently omitted.

suppressPackageStartupMessages({
  library(data.table)
  library(coloc)
  library(optparse)
})

opts <- parse_args(OptionParser(option_list = list(
  make_option("--gwas-region", type = "character", dest = "gwas_region"),
  make_option("--eqtl-region", type = "character", dest = "eqtl_region"),
  make_option("--source-type", type = "character", dest = "source_type"),
  make_option("--dataset-id", type = "character", dest = "dataset_id"),
  make_option("--sample-size", type = "character", dest = "sample_size"),
  make_option("--locus-id", type = "character", dest = "locus_id"),
  make_option("--p1", type = "double"),
  make_option("--p2", type = "double"),
  make_option("--p12", type = "double"),
  make_option("--min-overlap", type = "integer", dest = "min_overlap"),
  make_option("--out", type = "character")
)))
stopifnot(opts$source_type %in% c("eqtl_catalogue", "metabrain"))

EQTLCAT_COLS <- c("molecular_trait_id", "chromosome", "position", "ref", "alt",
                  "variant", "ma_samples", "maf", "pvalue", "beta", "se",
                  "type", "ac", "an", "r2", "molecular_trait_object_id",
                  "gene_id", "median_tpm", "rsid")

variant_key <- function(chrom, pos, a1, a2) {
  a1 <- toupper(a1); a2 <- toupper(a2)
  paste(chrom, pos, pmin(a1, a2), pmax(a1, a2), sep = ":")
}

result_row <- function(gene, gene_symbol, status, n_shared = NA_integer_,
                       n_dup_dropped = NA_integer_, pp = rep(NA_real_, 5),
                       top_h4_snp = NA_character_, top_h4_pp = NA_real_,
                       min_p_gwas = NA_real_, min_p_eqtl = NA_real_,
                       n_eqtl_p_floor = NA_integer_) {
  data.table(locus_id = opts$locus_id, dataset_id = opts$dataset_id,
             gene = gene, gene_symbol = gene_symbol, status = status,
             n_shared = n_shared, n_dup_dropped = n_dup_dropped,
             pp_h0 = pp[1], pp_h1 = pp[2], pp_h2 = pp[3], pp_h3 = pp[4],
             pp_h4 = pp[5], top_h4_snp = top_h4_snp, top_h4_pp = top_h4_pp,
             min_p_gwas = min_p_gwas, min_p_eqtl = min_p_eqtl,
             n_eqtl_p_floor = n_eqtl_p_floor)
}

# ---------------------------------------------------------------- GWAS side
gwas <- fread(opts$gwas_region, header = TRUE, sep = "\t")
stopifnot(identical(names(gwas), c("CHR", "POS", "ID", "A1", "A2", "FCAS",
                                   "FCON", "INFO", "BETA", "SE", "PVAL",
                                   "NCAS", "NCON", "NEFF2")))
stopifnot(nrow(gwas) > 0)
gwas[, key := variant_key(CHR, POS, A1, A2)]
n_gwas_dup <- sum(duplicated(gwas$key))
gwas <- gwas[!key %in% gwas$key[duplicated(gwas$key)]]
gwas[, maf_gwas := pmin(FCON, 1 - FCON)]

# ---------------------------------------------------------------- eQTL side
if (opts$source_type == "eqtl_catalogue") {
  eqtl_n <- as.integer(opts$sample_size)
  stopifnot(is.finite(eqtl_n), eqtl_n > 0)
  eq <- tryCatch(
    fread(opts$eqtl_region, header = FALSE, sep = "\t"),
    error = function(e) {
      # data.table errors on a zero-row file; that is a legitimate
      # "no cis genes tested in this window" outcome, checked below.
      if (grepl("empty", conditionMessage(e), ignore.case = TRUE)) {
        data.table()
      } else {
        stop(e)
      }
    }
  )
  if (nrow(eq) > 0) {
    stopifnot(ncol(eq) == length(EQTLCAT_COLS))
    setnames(eq, EQTLCAT_COLS)
    eq <- eq[is.finite(beta) & is.finite(se) & se > 0 &
             is.finite(maf) & maf > 0 & maf < 1]
    eq[, key := variant_key(chromosome, position, ref, alt)]
    eq[, gene := molecular_trait_id]
    eq[, gene_symbol := NA_character_]
    eq[, n_snp := eqtl_n]
  }
} else {  # metabrain
  eq <- fread(opts$eqtl_region, header = TRUE, sep = "\t")
  # header presence is asserted by the extraction rule; re-assert key columns
  stopifnot(all(c("PValue", "SNPChr", "SNPChrPos", "ProbeName", "RefAllele",
                  "AltAllele", "OverallZScore", "DatasetsNrSamples",
                  "HGNCName", "Meta-Beta", "Meta-SE") %in% names(eq)))
  if (nrow(eq) > 0) {
    eq[, beta := as.numeric(`Meta-Beta`)]
    eq[, se := as.numeric(`Meta-SE`)]
    eq <- eq[is.finite(beta) & is.finite(se) & se > 0]
    eq[, n_snp := vapply(strsplit(DatasetsNrSamples, ";", fixed = TRUE),
                         function(x) sum(as.numeric(x[x != "-"])), 0.0)]
    stopifnot(all(eq$n_snp > 0))
    eq[, key := variant_key(SNPChr, SNPChrPos, RefAllele, AltAllele)]
    eq[, gene := sub("\\..*$", "", ProbeName)]
    eq[, gene_symbol := HGNCName]
    eq[, pvalue := as.numeric(PValue)]
  }
}

if (nrow(eq) == 0) {
  out <- result_row(NA_character_, NA_character_, "no_eqtl_data")
  fwrite(out, opts$out, sep = "\t")
  quit(save = "no", status = 0)
}

# ------------------------------------------------------------ per-gene coloc
results <- vector("list", length = 0L)
for (g in unique(eq$gene)) {
  sub <- eq[gene == g]
  gsym <- sub$gene_symbol[1]
  n_dup <- sum(duplicated(sub$key))
  sub <- sub[!key %in% sub$key[duplicated(sub$key)]]

  m <- merge(sub, gwas, by = "key", suffixes = c("_e", "_g"))
  if (nrow(m) < opts$min_overlap) {
    results[[length(results) + 1L]] <- result_row(
      g, gsym, "insufficient_overlap", n_shared = nrow(m), n_dup_dropped = n_dup)
    next
  }

  d_gwas <- list(
    beta = m$BETA, varbeta = m$SE^2, snp = m$key, position = m$POS,
    type = "cc", s = median(m$NCAS / (m$NCAS + m$NCON)),
    N = round(median(m$NCAS + m$NCON))
  )

  n_p_floor <- 0L
  if (opts$source_type == "eqtl_catalogue") {
    d_eqtl <- list(
      beta = m$beta, varbeta = m$se^2, MAF = m$maf, N = m$n_snp[1],
      snp = m$key, position = m$POS, type = "quant"
    )
    min_p_eqtl <- min(m$pvalue)
  } else {
    # Meta-Beta/Meta-SE are native to the file; MAF for sdY estimation
    # comes from the matched GWAS variant (see config note)
    d_eqtl <- list(
      beta = m$beta, varbeta = m$se^2, MAF = m$maf_gwas, N = m$n_snp,
      snp = m$key, position = m$POS, type = "quant"
    )
    p <- m$pvalue
    n_p_floor <- sum(p == 0)  # Z-derived p can underflow to 0 in the file
    p[p == 0] <- 1e-300
    min_p_eqtl <- min(p)
  }

  res <- coloc.abf(dataset1 = d_gwas, dataset2 = d_eqtl,
                   p1 = opts$p1, p2 = opts$p2, p12 = opts$p12)
  s <- res$summary
  top_idx <- which.max(res$results$SNP.PP.H4)

  results[[length(results) + 1L]] <- result_row(
    g, gsym, "ok", n_shared = nrow(m), n_dup_dropped = n_dup,
    pp = as.numeric(s[c("PP.H0.abf", "PP.H1.abf", "PP.H2.abf",
                        "PP.H3.abf", "PP.H4.abf")]),
    top_h4_snp = res$results$snp[top_idx],
    top_h4_pp = res$results$SNP.PP.H4[top_idx],
    min_p_gwas = min(m$PVAL), min_p_eqtl = min_p_eqtl,
    n_eqtl_p_floor = n_p_floor)
}

out <- rbindlist(results)
stopifnot(nrow(out) > 0)
out[, n_gwas_dup_dropped := n_gwas_dup]
fwrite(out, opts$out, sep = "\t")
