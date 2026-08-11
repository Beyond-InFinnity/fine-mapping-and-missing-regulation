"""Parse Trubetskoy et al. 2022 Supplementary Table 3 into a loci TSV.

Input: the .xls extracted from the pinned supplementary zip.
Output: one row per locus with hg19 coordinates and an analysis status.

Fails loudly on any deviation from the expected structure (row count,
column names, coordinate sanity) — this file defines the experimental
units for the entire project.
"""
import argparse
import csv
import re

import xlrd

EXPECTED_HEADER = [
    "Chromosome", "top-index", "top-pos", "top-alleles", "top-freq",
    "top-info", "top-P", "top-OR", "top-SE", "merge-LEFT", "merge-RIGHT",
    "indices",
]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--xls", required=True)
    ap.add_argument("--sheet", required=True)
    ap.add_argument("--expected-n-loci", type=int, required=True)
    ap.add_argument("--mhc-chrom", type=int, required=True)
    ap.add_argument("--mhc-start", type=int, required=True)
    ap.add_argument("--mhc-end", type=int, required=True)
    ap.add_argument("--exclude-mhc", choices=["true", "false"], required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    book = xlrd.open_workbook(args.xls)
    sheet = book.sheet_by_name(args.sheet)

    header = [str(sheet.cell_value(0, c)).strip() for c in range(len(EXPECTED_HEADER))]
    assert header == EXPECTED_HEADER, f"header mismatch:\n{header}\nvs\n{EXPECTED_HEADER}"

    n_data = sheet.nrows - 1
    assert n_data == args.expected_n_loci, (
        f"expected {args.expected_n_loci} loci, sheet has {n_data} data rows"
    )

    rows = []
    for r in range(1, sheet.nrows):
        vals = {name: sheet.cell_value(r, c) for c, name in enumerate(EXPECTED_HEADER)}
        chrom_f = float(vals["Chromosome"])
        assert chrom_f == int(chrom_f), f"non-integer chromosome at row {r}: {chrom_f}"
        chrom = int(chrom_f)
        assert 1 <= chrom <= 23, f"chromosome out of range at row {r}: {chrom}"

        index_snp = str(vals["top-index"]).strip()
        assert index_snp, f"empty index SNP at row {r}"
        pos = int(float(vals["top-pos"]))
        left = int(float(vals["merge-LEFT"]))
        right = int(float(vals["merge-RIGHT"]))
        assert left < pos < right or left <= pos <= right, (
            f"index position outside locus bounds at row {r}: {left} {pos} {right}"
        )
        top_p = float(vals["top-P"])
        assert 0 < top_p < 1e-5, f"implausible top P at row {r}: {top_p}"
        top_freq = float(vals["top-freq"])
        assert 0 < top_freq < 1, f"top-freq out of range at row {r}: {top_freq}"

        # sanitized, filesystem/wildcard-safe id: "<chr>-<indexsnp>"
        snp_clean = re.sub(r"[^A-Za-z0-9]", "-", index_snp)
        locus_id = f"{chrom}-{snp_clean}"

        if chrom == 23:
            status = "skipped_chrX"  # autosome-only GWAS release cannot test these
        elif (
            args.exclude_mhc == "true"
            and chrom == args.mhc_chrom
            and not (right < args.mhc_start or left > args.mhc_end)
        ):
            status = "excluded_mhc"
        else:
            status = "pass"

        rows.append({
            "locus_id": locus_id,
            "chrom": chrom,
            "index_snp": index_snp,
            "index_pos_hg19": pos,
            "left_hg19": left,
            "right_hg19": right,
            "top_freq": top_freq,
            "top_p": top_p,
            "top_or": float(vals["top-OR"]),
            "top_se": float(vals["top-SE"]),
            "status": status,
        })

    ids = [r["locus_id"] for r in rows]
    assert len(ids) == len(set(ids)), "locus_id collision — sanitization broke uniqueness"

    n_mhc = sum(r["status"] == "excluded_mhc" for r in rows)
    n_x = sum(r["status"] == "skipped_chrX" for r in rows)
    n_pass = sum(r["status"] == "pass" for r in rows)
    assert n_pass + n_mhc + n_x == args.expected_n_loci

    with open(args.out, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()), delimiter="\t")
        w.writeheader()
        w.writerows(rows)

    print(f"loci: {n_pass} pass, {n_mhc} excluded_mhc, {n_x} skipped_chrX")


if __name__ == "__main__":
    main()
