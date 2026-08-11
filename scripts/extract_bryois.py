"""Extract per-locus regions from one Bryois et al. 2022 cell-type x
chromosome eQTL file.

Bryois files carry no positions or MAF: rows are
  <symbol>_<ENSG> <rsID> <TSS-dist> <pval> <beta>
Positions (GRCh38), effect/other alleles, and MAF come from the companion
snp_pos table, joined by rsID here so downstream coloc never touches the
raw pair files.

Output per locus: header + rows
  gene_id gene_symbol rsid dist pvalue beta pos ea oa maf
Loci with zero overlapping rows still get a header-only file (explicit,
not missing).
"""
import argparse
import csv
import gzip
import os


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--ct-file", required=True, help="{celltype}.{chr}.gz")
    ap.add_argument("--snp-pos", required=True, help="snp_pos.txt.gz (full)")
    ap.add_argument("--chrom", required=True)
    ap.add_argument("--intervals", required=True,
                    help="TSV: locus_id, start, end (no header)")
    ap.add_argument("--outdir", required=True)
    args = ap.parse_args()

    intervals = []
    with open(args.intervals) as f:
        for line in f:
            locus_id, start, end = line.rstrip("\n").split("\t")
            intervals.append((locus_id, int(start), int(end)))
    assert intervals, "empty intervals file"

    lo = min(s for _, s, _ in intervals)
    hi = max(e for _, _, e in intervals)
    want_chr = f"chr{args.chrom}"

    # rsID -> (pos, ea, oa, maf) for this chromosome, window-bounded
    snp = {}
    with gzip.open(args.snp_pos, "rt") as f:
        r = csv.DictReader(f, delimiter="\t")
        assert r.fieldnames == ["SNP", "SNP_id_hg38", "SNP_id_hg19",
                                "effect_allele", "other_allele", "MAF"], r.fieldnames
        for row in r:
            c, p = row["SNP_id_hg38"].split(":")
            if c != want_chr:
                continue
            p = int(p)
            if lo <= p <= hi:
                snp[row["SNP"]] = (p, row["effect_allele"],
                                   row["other_allele"], row["MAF"])

    os.makedirs(args.outdir, exist_ok=True)
    header = "gene_id\tgene_symbol\trsid\tdist\tpvalue\tbeta\tpos\tea\toa\tmaf\n"
    handles = {}
    for locus_id, _s, _e in intervals:
        handles[locus_id] = open(os.path.join(args.outdir, f"{locus_id}.tsv"), "w")
        handles[locus_id].write(header)

    n_rows = 0
    n_matched = 0
    with gzip.open(args.ct_file, "rt") as f:
        for line in f:
            n_rows += 1
            gene, rsid, dist, pval, beta = line.rstrip("\n").split(" ")
            hit = snp.get(rsid)
            if hit is None:
                continue
            pos, ea, oa, maf = hit
            sym, _, ensg = gene.rpartition("_")
            for locus_id, s, e in intervals:
                if s <= pos <= e:
                    n_matched += 1
                    handles[locus_id].write(
                        f"{ensg}\t{sym}\t{rsid}\t{dist}\t{pval}\t{beta}\t"
                        f"{pos}\t{ea}\t{oa}\t{maf}\n")

    for h in handles.values():
        h.close()
    assert n_rows > 0, f"empty cell-type file {args.ct_file}"
    print(f"{os.path.basename(args.ct_file)}: {n_rows} rows scanned, "
          f"{n_matched} written across {len(intervals)} loci")


if __name__ == "__main__":
    main()
