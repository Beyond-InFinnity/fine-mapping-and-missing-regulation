"""Harmonize PGC3 SCZ summary statistics: parse, QC, lift hg19->hg38,
sort, bgzip, tabix — producing analysis-ready files in both builds.

Outputs:
  {out_prefix}.hg19.tsv.gz  (+.tbi)   sorted, indexed
  {out_prefix}.hg38.tsv.gz  (+.tbi)   sorted, indexed, GRCh38 positions
  {out_prefix}.meta.json               row counts and drop reasons

Column contract (both builds):
  CHR POS ID A1 A2 FCAS FCON INFO BETA SE PVAL NCAS NCON NEFF2

Every dropped row is counted by reason; the script aborts if drops exceed
0.1% of input or if the liftover rate falls below --min-lift-rate.
"""
import argparse
import gzip
import json
import math
import os
import subprocess
import sys

OUT_COLS = ["CHR", "POS", "ID", "A1", "A2", "FCAS", "FCON", "INFO",
            "BETA", "SE", "PVAL", "NCAS", "NCON", "NEFF2"]
PRIMARY_CHROMS = {f"chr{i}" for i in range(1, 23)}


def run(cmd: str) -> None:
    print(f"+ {cmd}", flush=True)
    subprocess.run(cmd, shell=True, check=True)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--raw-gz", required=True)
    ap.add_argument("--chain", required=True)
    ap.add_argument("--expected-columns", required=True,
                    help="comma-separated expected raw header")
    ap.add_argument("--expected-n-variants", type=int, required=True,
                    help="-1 = read the count from the file's ##nVariants "
                         "header line instead of an external expectation")
    ap.add_argument("--min-lift-rate", type=float, required=True)
    ap.add_argument("--out-prefix", required=True)
    ap.add_argument("--tmpdir", required=True)
    args = ap.parse_args()

    expected_cols = args.expected_columns.split(",")
    os.makedirs(args.tmpdir, exist_ok=True)
    os.makedirs(os.path.dirname(args.out_prefix), exist_ok=True)

    # ------------------------------------------------------------------
    # Pass 1: parse + QC, write unsorted hg19 body and a BED for CrossMap
    # keyed by input row number (rsIDs are not guaranteed unique).
    # ------------------------------------------------------------------
    drops = {"bad_field_count": 0, "nonfinite_beta_se": 0, "se_nonpositive": 0,
             "pval_out_of_range": 0, "freq_out_of_range": 0}
    n_in = 0
    kept_rows = 0

    hg19_body = os.path.join(args.tmpdir, "hg19_body.tsv")
    bed_in = os.path.join(args.tmpdir, "lift_in.bed")

    expected_n = args.expected_n_variants
    with gzip.open(args.raw_gz, "rt") as f, \
            open(hg19_body, "w") as out19, open(bed_in, "w") as bed:
        header = None
        for line in f:
            if line.startswith("##"):
                if line.startswith("##nVariants="):
                    n_from_header = int(line.strip().split("=")[1])
                    if expected_n == -1:
                        expected_n = n_from_header
                continue
            header = line.rstrip("\n").split("\t")
            break
        assert expected_n > 0, "no expectation given and no ##nVariants header"
        assert header == expected_cols, (
            f"raw header mismatch:\n{header}\nvs\n{expected_cols}"
        )
        idx = {c: i for i, c in enumerate(header)}

        for line in f:
            n_in += 1
            p = line.rstrip("\n").split("\t")
            if len(p) != len(expected_cols):
                drops["bad_field_count"] += 1
                continue
            try:
                beta = float(p[idx["BETA"]])
                se = float(p[idx["SE"]])
                pval = float(p[idx["PVAL"]])
                fcas = float(p[idx["FCAS"]])
                fcon = float(p[idx["FCON"]])
                pos = int(p[idx["POS"]])
            except ValueError:
                drops["bad_field_count"] += 1
                continue
            if not (math.isfinite(beta) and math.isfinite(se)):
                drops["nonfinite_beta_se"] += 1
                continue
            if se <= 0:
                drops["se_nonpositive"] += 1
                continue
            if not (0 < pval <= 1):
                drops["pval_out_of_range"] += 1
                continue
            if not (0 < fcas < 1 and 0 < fcon < 1):
                drops["freq_out_of_range"] += 1
                continue

            row = [p[idx["CHROM"]], str(pos), p[idx["ID"]], p[idx["A1"]],
                   p[idx["A2"]], p[idx["FCAS"]], p[idx["FCON"]],
                   p[idx["IMPINFO"]], p[idx["BETA"]], p[idx["SE"]],
                   p[idx["PVAL"]], p[idx["NCAS"]], p[idx["NCON"]],
                   p[idx["NEFFDIV2"]]]
            out19.write("\t".join(row) + "\n")
            bed.write(f"chr{p[idx['CHROM']]}\t{pos - 1}\t{pos}\t{kept_rows}\n")
            kept_rows += 1

    n_dropped = sum(drops.values())
    assert n_in == expected_n, (
        f"input had {n_in} variants, expected {expected_n}"
    )
    assert n_dropped <= 0.001 * n_in, f"excessive QC drops: {drops}"
    print(f"parsed {n_in} variants, kept {kept_rows}, drops: {drops}", flush=True)

    # ------------------------------------------------------------------
    # CrossMap hg19 -> hg38
    # ------------------------------------------------------------------
    bed_out = os.path.join(args.tmpdir, "lift_out.bed")
    run(f"CrossMap bed {args.chain} {bed_in} {bed_out}")

    # flat array keyed by row number (0 = unmapped sentinel; real positions
    # are >= 1) — a dict for 7.5M rows would need ~1 GB
    from array import array
    lift = array("q", bytes(8 * kept_rows))
    n_lifted = 0
    lift_drops = {"alt_contig": 0, "chrom_changed": 0}
    with open(bed_in) as f_src:
        src_chrom = [sys.intern(line.split("\t", 1)[0]) for line in f_src]
    with open(bed_out) as f:
        for line in f:
            chrom, _start, end, rowno = line.rstrip("\n").split("\t")[:4]
            rowno = int(rowno)
            if chrom not in PRIMARY_CHROMS:
                lift_drops["alt_contig"] += 1
                continue
            if chrom != src_chrom[rowno]:
                lift_drops["chrom_changed"] += 1
                continue
            lift[rowno] = int(end)
            n_lifted += 1

    lift_rate = n_lifted / kept_rows
    print(f"lifted {n_lifted}/{kept_rows} ({lift_rate:.4f}), drops: {lift_drops}",
          flush=True)
    assert lift_rate >= args.min_lift_rate, (
        f"lift rate {lift_rate:.4f} below floor {args.min_lift_rate}"
    )

    # ------------------------------------------------------------------
    # Write hg38 body (unsorted), then sort/bgzip/tabix both builds
    # ------------------------------------------------------------------
    hg38_body = os.path.join(args.tmpdir, "hg38_body.tsv")
    with open(hg19_body) as f, open(hg38_body, "w") as out38:
        for rowno, line in enumerate(f):
            new_pos = lift[rowno]
            if new_pos == 0:
                continue
            p = line.rstrip("\n").split("\t")
            p[1] = str(new_pos)
            out38.write("\t".join(p) + "\n")

    header_line = "\t".join(OUT_COLS)
    for build, body in (("hg19", hg19_body), ("hg38", hg38_body)):
        out = f"{args.out_prefix}.{build}.tsv.gz"
        sorted_body = os.path.join(args.tmpdir, f"{build}_sorted.tsv")
        run(f"LC_ALL=C sort -k1,1n -k2,2n -S 1G -T {args.tmpdir} "
            f"{body} > {sorted_body}")
        run(f"(echo '{header_line}'; cat {sorted_body}) | bgzip -@4 > {out}")
        run(f"tabix -f -S 1 -s 1 -b 2 -e 2 {out}")
        os.unlink(sorted_body)

    meta = {
        "n_input": n_in,
        "n_after_qc": kept_rows,
        "qc_drops": drops,
        "n_hg38": len(lift),
        "lift_rate": lift_rate,
        "lift_drops": lift_drops,
    }
    with open(f"{args.out_prefix}.meta.json", "w") as f:
        json.dump(meta, f, indent=2)
    print(json.dumps(meta, indent=2))


if __name__ == "__main__":
    sys.exit(main())
