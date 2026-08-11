"""Lift locus index SNPs hg19->hg38 with a two-source cross-check.

Primary: CrossMap on the index SNP position.
Cross-check: the same rsID looked up in the already-lifted GWAS file
(harmonize_gwas output). The two must agree for every locus; any
disagreement aborts — a coordinate error here silently shifts every
downstream extraction window.

Adds region_start/end = index_pos_hg38 +/- window_bp (floored at 1).
"""
import argparse
import csv
import os
import subprocess


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--loci", required=True)
    ap.add_argument("--gwas-hg38", required=True, help="bgzipped+tabixed GWAS, GRCh38")
    ap.add_argument("--chain", required=True)
    ap.add_argument("--window-bp", type=int, required=True)
    ap.add_argument("--tmpdir", required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    os.makedirs(args.tmpdir, exist_ok=True)
    with open(args.loci) as f:
        loci = list(csv.DictReader(f, delimiter="\t"))

    # CrossMap the index positions of analysable loci
    bed_in = os.path.join(args.tmpdir, "loci_in.bed")
    bed_out = os.path.join(args.tmpdir, "loci_out.bed")
    todo = [r for r in loci if r["status"] == "pass"]
    with open(bed_in, "w") as f:
        for r in todo:
            pos = int(r["index_pos_hg19"])
            f.write(f"chr{r['chrom']}\t{pos - 1}\t{pos}\t{r['locus_id']}\n")
    subprocess.run(f"CrossMap bed {args.chain} {bed_in} {bed_out}",
                   shell=True, check=True)

    crossmap_pos = {}
    with open(bed_out) as f:
        for line in f:
            chrom, _s, end, locus_id = line.rstrip("\n").split("\t")[:4]
            crossmap_pos[locus_id] = (chrom.removeprefix("chr"), int(end))
    missing = [r["locus_id"] for r in todo if r["locus_id"] not in crossmap_pos]
    assert not missing, f"CrossMap failed to lift index SNPs: {missing}"

    # Cross-check: rsID position in the lifted GWAS file
    disagreements = []
    n_checked = 0
    for r in todo:
        chrom, pos38 = crossmap_pos[r["locus_id"]]
        assert chrom == r["chrom"], (
            f"{r['locus_id']}: index SNP lifted to different chromosome {chrom}"
        )
        q = subprocess.run(
            f"tabix {args.gwas_hg38} {chrom}:{pos38}-{pos38}",
            shell=True, check=True, capture_output=True, text=True,
        )
        hits = [ln.split("\t") for ln in q.stdout.splitlines()]
        ids_here = {h[2] for h in hits}
        if r["index_snp"] in ids_here:
            n_checked += 1
        else:
            disagreements.append((r["locus_id"], r["index_snp"], f"{chrom}:{pos38}"))

    assert not disagreements, (
        "index SNP rsID not found at CrossMap-lifted GWAS position for: "
        f"{disagreements}"
    )
    print(f"cross-check: {n_checked}/{len(todo)} index SNPs verified "
          f"(CrossMap position == lifted-GWAS rsID position)")

    fieldnames = list(loci[0].keys()) + [
        "index_pos_hg38", "region_start_hg38", "region_end_hg38",
    ]
    with open(args.out, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames, delimiter="\t")
        w.writeheader()
        for r in loci:
            if r["status"] == "pass":
                _chrom, pos38 = crossmap_pos[r["locus_id"]]
                r["index_pos_hg38"] = pos38
                r["region_start_hg38"] = max(1, pos38 - args.window_bp)
                r["region_end_hg38"] = pos38 + args.window_bp
            else:
                r["index_pos_hg38"] = ""
                r["region_start_hg38"] = ""
                r["region_end_hg38"] = ""
            w.writerow(r)


if __name__ == "__main__":
    main()
