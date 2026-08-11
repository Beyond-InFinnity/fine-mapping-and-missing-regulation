#!/usr/bin/env Rscript
# Multi-signal colocalization of one locus x one eQTL dataset via
# coloc.bf_bf: GWAS SuSiE log-BF matrix (run_susie_rss.R output) against
# the eQTL Catalogue's precomputed per-gene SuSiE lbf matrices.
#
# This relaxes coloc.abf's single-causal-variant assumption on BOTH sides:
# each GWAS signal (component with a credible set) is tested against each
# eQTL signal. Per gene we report the best PP4 over signal pairs.
#
# Variant matching: eQTL 'variant' (chrN_pos_ref_alt) -> chrom:pos:{sorted
# allele pair}, identical to the GWAS-side lbf column names. PP4 from lbf
# is sign-free, so allele orientation does not matter here.

suppressPackageStartupMessages({
  library(data.table)
  library(coloc)
  library(optparse)
})

opts <- parse_args(OptionParser(option_list = list(
  make_option("--gwas-lbf", type = "character", dest = "gwas_lbf"),
  make_option("--gwas-cs", type = "character", dest = "gwas_cs"),
  make_option("--eqtl-lbf", type = "character", dest = "eqtl_lbf"),
  make_option("--dataset-id", type = "character", dest = "dataset_id"),
  make_option("--locus-id", type = "character", dest = "locus_id"),
  make_option("--p1", type = "double"),
  make_option("--p2", type = "double"),
  make_option("--p12", type = "double"),
  make_option("--min-overlap", type = "integer", dest = "min_overlap"),
  make_option("--out", type = "character")
)))

result_row <- function(gene, status, gwas_cs = NA_character_,
                       eqtl_cs = NA_character_, n_overlap = NA_integer_,
                       pp = rep(NA_real_, 5), n_pairs = NA_integer_) {
  data.table(locus_id = opts$locus_id, dataset_id = opts$dataset_id,
             gene = gene, status = status, gwas_cs = gwas_cs,
             eqtl_cs = eqtl_cs, n_overlap = n_overlap,
             pp_h0 = pp[1], pp_h1 = pp[2], pp_h2 = pp[3], pp_h3 = pp[4],
             pp_h4 = pp[5], n_signal_pairs = n_pairs)
}
finish <- function(rows) {
  out <- rbindlist(rows)
  stopifnot(nrow(out) > 0)
  fwrite(out, opts$out, sep = "\t")
  quit(save = "no", status = 0)
}

# GWAS side: only components that formed a credible set carry evidence of
# a real signal; restrict to them (standard coloc.susie behaviour).
gwas_cs <- fread(opts$gwas_cs, header = TRUE, sep = "\t")
if (nrow(gwas_cs) == 0) {
  finish(list(result_row(NA_character_, "no_gwas_credible_set")))
}
gwas_lbf_dt <- fread(opts$gwas_lbf, header = TRUE, sep = "\t")
gwas_mat <- as.matrix(gwas_lbf_dt[, -1])
rownames(gwas_mat) <- paste0("gwas_L", gwas_lbf_dt$component)
keep_l <- sort(unique(as.integer(sub("^L", "", gwas_cs$cs_id))))
gwas_mat <- gwas_mat[keep_l, , drop = FALSE]

eq <- fread(opts$eqtl_lbf, header = TRUE, sep = "\t")
if (nrow(eq) == 0) {
  finish(list(result_row(NA_character_, "no_eqtl_susie_data")))
}
vparts <- tstrsplit(sub("^chr", "", eq$variant), "_", fixed = TRUE)
stopifnot(length(vparts) == 4)
eq[, key := paste(vparts[[1]], vparts[[2]],
                  pmin(toupper(vparts[[3]]), toupper(vparts[[4]])),
                  pmax(toupper(vparts[[3]]), toupper(vparts[[4]])),
                  sep = ":")]

lbf_cols <- paste0("lbf_variable", 1:10)
rows <- list()
for (g in unique(eq$molecular_trait_id)) {
  sub <- eq[molecular_trait_id == g]
  sub <- sub[!key %in% key[duplicated(key)]]
  shared <- intersect(colnames(gwas_mat), sub$key)
  if (length(shared) < opts$min_overlap) {
    rows[[length(rows) + 1L]] <- result_row(
      g, "insufficient_overlap", n_overlap = length(shared))
    next
  }
  sub <- sub[match(shared, key)]
  emat <- t(as.matrix(sub[, ..lbf_cols]))
  colnames(emat) <- shared
  rownames(emat) <- paste0("eqtl_L", 1:10)
  # drop eQTL components that are all ~zero (unused SuSiE slots)
  active <- apply(abs(emat), 1, max) > 1e-8
  if (!any(active)) {
    rows[[length(rows) + 1L]] <- result_row(g, "no_eqtl_signal")
    next
  }
  emat <- emat[active, , drop = FALSE]

  res <- coloc.bf_bf(gwas_mat[, shared, drop = FALSE], emat,
                     p1 = opts$p1, p2 = opts$p2, p12 = opts$p12)
  s <- as.data.table(res$summary)
  if (nrow(s) == 0) {
    rows[[length(rows) + 1L]] <- result_row(
      g, "no_signal_pairs", n_overlap = length(shared))
    next
  }
  best <- s[which.max(PP.H4.abf)]
  rows[[length(rows) + 1L]] <- result_row(
    g, "ok",
    gwas_cs = as.character(best$idx1), eqtl_cs = as.character(best$idx2),
    n_overlap = length(shared),
    pp = as.numeric(best[, .(PP.H0.abf, PP.H1.abf, PP.H2.abf,
                             PP.H3.abf, PP.H4.abf)]),
    n_pairs = nrow(s))
}
finish(rows)
