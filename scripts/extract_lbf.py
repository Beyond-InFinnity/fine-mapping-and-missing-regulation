"""One-pass split of an eQTL Catalogue lbf_variable file into per-locus
extracts (all chromosomes; the input file is genome-wide per dataset).

Output: {outdir}/{locus_id}.tsv.gz with the original 15 columns, for every
analysable locus (header-only when a locus has no rows).
"""
import argparse
import csv
import gzip
import os

EXPECTED = ["molecular_trait_id", "region", "variant", "chromosome",
            "position"] + [f"lbf_variable{i}" for i in range(1, 11)]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--lbf", required=True)
    ap.add_argument("--loci", required=True, help="loci_hg38.tsv")
    ap.add_argument("--outdir", required=True)
    args = ap.parse_args()

    by_chrom: dict[str, list[tuple[str, int, int]]] = {}
    with open(args.loci) as f:
        for r in csv.DictReader(f, delimiter="\t"):
            if r["status"] != "pass":
                continue
            by_chrom.setdefault(r["chrom"], []).append(
                (r["locus_id"], int(r["region_start_hg38"]),
                 int(r["region_end_hg38"])))
    assert by_chrom, "no pass loci"

    os.makedirs(args.outdir, exist_ok=True)
    header = "\t".join(EXPECTED) + "\n"
    handles = {}
    for loci in by_chrom.values():
        for locus_id, _s, _e in loci:
            handles[locus_id] = gzip.open(
                os.path.join(args.outdir, f"{locus_id}.tsv.gz"), "wt")
            handles[locus_id].write(header)

    n_written = 0
    with gzip.open(args.lbf, "rt") as f:
        obs_header = f.readline().rstrip("\n").split("\t")
        assert obs_header == EXPECTED, f"lbf header mismatch: {obs_header}"
        for line in f:
            parts = line.split("\t", 5)
            chrom, pos = parts[3], int(parts[4])
            loci = by_chrom.get(chrom)
            if loci is None:
                continue
            for locus_id, s, e in loci:
                if s <= pos <= e:
                    handles[locus_id].write(line)
                    n_written += 1

    for h in handles.values():
        h.close()
    assert n_written > 0, "no lbf rows overlapped any locus"
    print(f"{os.path.basename(args.lbf)}: {n_written} rows across "
          f"{len(handles)} loci")


if __name__ == "__main__":
    main()
