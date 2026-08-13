#!/usr/bin/env Rscript
# Transitive gene nomination for methylation-explained loci:
# for every CpG that colocalizes with the GWAS (PP4 > threshold), test
# whether that CpG's meQTL signal ALSO shares a causal variant with each
# gene's MetaBrain cortex eQTL signal in the locus. A strong
# GWAS<->CpG + CpG<->gene chain nominates the gene even where the direct
# GWAS<->gene eQTL colocalization was underpowered.
#
# Variants join on rsID (meQTL is hg19, MetaBrain GRCh38); positions fed
# to coloc come from the meQTL side for BOTH datasets (coloc.abf joins
# on snp AND position). MAF for both sides comes from the meQTL Freq
# column (MetaBrain publishes none; same-variant frequency is
# population-appropriate for these EUR-dominated resources).

suppressPackageStartupMessages({
  library(data.table)
  library(coloc)
  library(optparse)
})

opts <- parse_args(OptionParser(option_list = list(
  make_option("--gwas-meqtl-coloc", type = "character", dest = "gm"),
  make_option("--meqtl-region", type = "character", dest = "meqtl_region"),
  make_option("--metabrain-region", type = "character", dest = "mb_region"),
  make_option("--locus-id", type = "character", dest = "locus_id"),
  make_option("--pp4-threshold", type = "double", dest = "thr"),
  make_option("--meqtl-n", type = "integer", dest = "meqtl_n"),
  make_option("--p1", type = "double"),
  make_option("--p2", type = "double"),
  make_option("--p12", type = "double"),
  make_option("--min-overlap", type = "integer", dest = "min_overlap"),
  make_option("--out", type = "character")
)))

row_out <- function(cpg, cpg_gwas_pp4, gene, gene_symbol, status,
                    n_shared = NA_integer_, pp = rep(NA_real_, 5)) {
  data.table(locus_id = opts$locus_id, cpg = cpg,
             cpg_gwas_pp4 = cpg_gwas_pp4, gene = gene,
             gene_symbol = gene_symbol, status = status,
             n_shared = n_shared, pp_h0 = pp[1], pp_h1 = pp[2],
             pp_h2 = pp[3], pp_h3 = pp[4], pp_h4 = pp[5])
}
finish <- function(rows) {
  out <- rbindlist(rows)
  stopifnot(nrow(out) > 0)
  fwrite(out, opts$out, sep = "\t")
  quit(save = "no", status = 0)
}

gm <- fread(opts$gm, sep = "\t")
hits <- gm[status == "ok" & pp_h4 >= opts$thr]
if (nrow(hits) == 0) {
  finish(list(row_out(NA_character_, NA_real_, NA_character_,
                      NA_character_, "no_gwas_meqtl_coloc")))
}

mq <- fread(opts$meqtl_region, header = TRUE, sep = "\t")
stopifnot(all(c("SNP", "BP", "Freq", "Probe", "b", "SE") %in% names(mq)))
mq <- mq[, .(rsid = SNP, pos = BP,
             maf = pmin(as.numeric(Freq), 1 - as.numeric(Freq)),
             cpg = Probe, beta_m = as.numeric(b), se_m = as.numeric(SE))]
mq <- mq[is.finite(beta_m) & is.finite(se_m) & se_m > 0 &
         is.finite(maf) & maf > 0 & maf < 1]

mb <- fread(opts$mb_region, header = TRUE, sep = "\t")
stopifnot(all(c("SNPName", "ProbeName", "HGNCName", "Meta-Beta",
                "Meta-SE", "DatasetsNrSamples") %in% names(mb)))
if (nrow(mb) == 0) {
  finish(lapply(seq_len(nrow(hits)), function(i) row_out(
    hits$gene[i], hits$pp_h4[i], NA_character_, NA_character_,
    "no_metabrain_data")))
}
# SNPName format chr:pos:rsid:alleles; tolerate malformed names
mb <- mb[vapply(strsplit(SNPName, ":", fixed = TRUE), length, 0L) >= 3]
stopifnot(nrow(mb) > 0)
mb[, rsid := tstrsplit(SNPName, ":", fixed = TRUE)[[3]]]
mb <- mb[rsid != "nors"]
mb[, beta_e := as.numeric(`Meta-Beta`)]
mb[, se_e := as.numeric(`Meta-SE`)]
mb[, n_e := vapply(strsplit(DatasetsNrSamples, ";", fixed = TRUE),
                   function(x) sum(as.numeric(x[x != "-"])), 0.0)]
mb <- mb[is.finite(beta_e) & is.finite(se_e) & se_e > 0 & n_e > 0]
mb[, gene := sub("\\..*$", "", ProbeName)]
mb[, gene_symbol := HGNCName]
mb <- mb[, .(rsid, gene, gene_symbol, beta_e, se_e, n_e)]

rows <- list()
for (i in seq_len(nrow(hits))) {
  cpg_id <- hits$gene[i]          # in the GWAS-meQTL output, trait = CpG
  cpg_pp4 <- hits$pp_h4[i]
  sub_m <- mq[cpg == cpg_id]
  sub_m <- sub_m[!rsid %in% rsid[duplicated(rsid)]]
  if (nrow(sub_m) == 0) {
    rows[[length(rows) + 1L]] <- row_out(cpg_id, cpg_pp4, NA_character_,
                                         NA_character_, "cpg_not_in_region")
    next
  }
  for (g in unique(mb$gene)) {
    sub_e <- mb[gene == g]
    gsym <- sub_e$gene_symbol[1]
    sub_e <- sub_e[!rsid %in% rsid[duplicated(rsid)]]
    m <- merge(sub_m, sub_e, by = "rsid")
    if (nrow(m) < opts$min_overlap) {
      rows[[length(rows) + 1L]] <- row_out(cpg_id, cpg_pp4, g, gsym,
                                           "insufficient_overlap",
                                           n_shared = nrow(m))
      next
    }
    d_m <- list(beta = m$beta_m, varbeta = m$se_m^2, MAF = m$maf,
                N = opts$meqtl_n, snp = m$rsid, position = m$pos,
                type = "quant")
    d_e <- list(beta = m$beta_e, varbeta = m$se_e^2, MAF = m$maf,
                N = m$n_e, snp = m$rsid, position = m$pos, type = "quant")
    res <- coloc.abf(dataset1 = d_m, dataset2 = d_e,
                     p1 = opts$p1, p2 = opts$p2, p12 = opts$p12)
    s <- res$summary
    rows[[length(rows) + 1L]] <- row_out(
      cpg_id, cpg_pp4, g, gsym, "ok", n_shared = nrow(m),
      pp = as.numeric(s[c("PP.H0.abf", "PP.H1.abf", "PP.H2.abf",
                          "PP.H3.abf", "PP.H4.abf")]))
  }
}
finish(rows)
