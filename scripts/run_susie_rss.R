#!/usr/bin/env Rscript
# GWAS-side fine-mapping of one locus with susie_rss.
#
# LD comes from the project's 1000G GRCh38 EUR panel (n=503). Variants are
# matched to the panel on chrom:pos:{allele pair}; each z-score is sign-
# aligned to the panel's counted allele (bim A1) so z and R refer to the
# same allele per variant. Reference-panel LD for a 161k-sample meta-
# analysis is a documented approximation: susie_rss runs with
# estimate_residual_variance=FALSE (robust default) and convergence
# diagnostics are recorded per locus.
#
# Outputs: {prefix}.cs.tsv         credible-set membership (header-only if none)
#          {prefix}.lbf.tsv.gz     L x p log-Bayes-factor matrix (coloc.bf_bf input)
#          {prefix}.summary.json   diagnostics: matching, convergence, CS count

suppressPackageStartupMessages({
  library(data.table)
  library(susieR)
  library(optparse)
  library(jsonlite)
})

opts <- parse_args(OptionParser(option_list = list(
  make_option("--gwas-region", type = "character", dest = "gwas_region"),
  make_option("--bfile", type = "character"),
  make_option("--locus-id", type = "character", dest = "locus_id"),
  make_option("--L", type = "integer"),
  make_option("--coverage", type = "double"),
  make_option("--out-prefix", type = "character", dest = "out_prefix"),
  make_option("--tmpdir", type = "character")
)))

dir.create(opts$tmpdir, recursive = TRUE, showWarnings = FALSE)
dir.create(dirname(opts$out_prefix), recursive = TRUE, showWarnings = FALSE)

gwas <- fread(opts$gwas_region, header = TRUE, sep = "\t")
stopifnot(nrow(gwas) > 0, all(c("CHR", "POS", "A1", "A2", "BETA", "SE",
                                "NEFF2") %in% names(gwas)))
gwas <- gwas[is.finite(BETA) & is.finite(SE) & SE > 0]
gwas[, A1 := toupper(A1)][, A2 := toupper(A2)]
gwas[, key := paste(CHR, POS, pmin(A1, A2), pmax(A1, A2), sep = ":")]
gwas <- gwas[!key %in% key[duplicated(key)]]
n_gwas_eff <- round(median(2 * gwas$NEFF2))

bim <- fread(paste0(opts$bfile, ".bim"), header = FALSE,
             col.names = c("chr", "id", "cm", "pos", "a1", "a2"))
bim <- bim[pos >= min(gwas$POS) & pos <= max(gwas$POS)]
bim[, key := paste(chr, pos, pmin(a1, a2), pmax(a1, a2), sep = ":")]
bim[, bim_row := .I]
bim <- bim[!key %in% key[duplicated(key)]]

m <- merge(gwas, bim, by = "key")
setorder(m, bim_row)  # plink preserves genotype-file order for --extract
n_matched <- nrow(m)
stopifnot(n_matched >= 50)

# sign alignment: plink counts bim a1; flip z where GWAS A1 is the panel a2
m[, flip := fifelse(A1 == a1, 1.0, -1.0)]
stopifnot(all(m$A1 == m$a1 | m$A1 == m$a2))
m[, z := (BETA / SE) * flip]

snplist <- file.path(opts$tmpdir, paste0(opts$locus_id, ".snplist"))
writeLines(m$id, snplist)
ldprefix <- file.path(opts$tmpdir, paste0(opts$locus_id, "_ld"))
status <- system2("plink", c(
  "--bfile", opts$bfile, "--extract", snplist, "--keep-allele-order",
  "--r", "square", "bin", "--memory", "3000", "--threads", "2",
  "--out", ldprefix), stdout = FALSE, stderr = paste0(ldprefix, ".err"))
stopifnot(status == 0)

ldbin <- paste0(ldprefix, ".ld.bin")
R <- matrix(readBin(ldbin, "double", n = n_matched^2), n_matched, n_matched)
stopifnot(nrow(R) == n_matched, max(abs(diag(R) - 1)) < 1e-6)
unlink(c(ldbin, snplist, paste0(ldprefix, c(".log", ".nosex", ".err"))))

fit <- susie_rss(z = m$z, R = R, n = n_gwas_eff, L = opts$L,
                 coverage = opts$coverage,
                 estimate_residual_variance = FALSE)

# ---------------------------------------------------------------- outputs
cs_rows <- list()
if (!is.null(fit$sets$cs)) {
  for (cs_name in names(fit$sets$cs)) {
    idx <- fit$sets$cs[[cs_name]]
    cs_rows[[cs_name]] <- data.table(
      locus_id = opts$locus_id, cs_id = cs_name,
      cs_size = length(idx),
      cs_coverage = fit$sets$coverage[match(cs_name, names(fit$sets$cs))],
      variant_key = m$key[idx], panel_id = m$id[idx], rsid = m$ID[idx],
      pip = fit$pip[idx], z = m$z[idx], pos = m$POS[idx])
  }
}
cs_dt <- if (length(cs_rows)) rbindlist(cs_rows) else
  data.table(locus_id = character(), cs_id = character(),
             cs_size = integer(), cs_coverage = numeric(),
             variant_key = character(), panel_id = character(),
             rsid = character(), pip = numeric(), z = numeric(),
             pos = integer())
fwrite(cs_dt, paste0(opts$out_prefix, ".cs.tsv"), sep = "\t")

lbf <- fit$lbf_variable  # L x p
colnames(lbf) <- m$key
lbf_dt <- data.table(component = seq_len(nrow(lbf)), lbf)
fwrite(lbf_dt, paste0(opts$out_prefix, ".lbf.tsv.gz"), sep = "\t")

summary <- list(
  locus_id = opts$locus_id,
  n_gwas_region = nrow(gwas), n_panel_region = nrow(bim),
  n_matched = n_matched, match_rate_gwas = n_matched / nrow(gwas),
  n_gwas_eff = n_gwas_eff,
  converged = isTRUE(fit$converged), niter = fit$niter,
  n_cs = length(fit$sets$cs), L = opts$L, coverage = opts$coverage,
  max_abs_z = max(abs(m$z))
)
write_json(summary, paste0(opts$out_prefix, ".summary.json"),
           auto_unbox = TRUE, digits = 6)
cat(sprintf("%s: %d matched variants, converged=%s, %d credible sets\n",
            opts$locus_id, n_matched, summary$converged, summary$n_cs))
