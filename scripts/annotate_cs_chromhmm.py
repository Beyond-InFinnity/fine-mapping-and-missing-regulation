"""Annotate GWAS SuSiE credible-set variants with chromHMM states.

For every analysable locus, computes per-locus summaries of where its
credible-set variants (PIP-weighted) land in fetal-brain vs adult-brain
regulatory chromatin (Roadmap 15-state chromHMM, hg38lift):

  fetal_reg_pip  : sum of PIP over CS variants in a regulatory state in
                   ANY fetal epigenome / total CS PIP
  adult_reg_pip  : same for the adult contrast epigenome(s)
  any_fetal_reg / any_adult_reg : indicator, >=1 CS variant in a
                   regulatory state
  fetal_only_reg : >=1 CS variant regulatory in fetal but NOT adult

Loci without credible sets get explicit NA rows.
"""
import argparse
import bisect
import csv
import glob
import gzip
import os


def load_bed(paths: list[str], keep_states: set[str]):
    """chrom -> (sorted starts, ends, states) for regulatory intervals."""
    ivals: dict[str, list[tuple[int, int]]] = {}
    for path in paths:
        with gzip.open(path, "rt") as f:
            for line in f:
                chrom, start, end, state = line.rstrip("\n").split("\t")[:4]
                if state in keep_states:
                    ivals.setdefault(chrom.removeprefix("chr"), []).append(
                        (int(start), int(end)))
    index = {}
    for chrom, xs in ivals.items():
        xs.sort()
        # merge overlaps so bisect lookup is unambiguous
        merged = []
        for s, e in xs:
            if merged and s <= merged[-1][1]:
                merged[-1] = (merged[-1][0], max(merged[-1][1], e))
            else:
                merged.append((s, e))
        index[chrom] = ([s for s, _ in merged], [e for _, e in merged])
    return index


def in_region(index, chrom: str, pos: int) -> bool:
    entry = index.get(chrom)
    if entry is None:
        return False
    starts, ends = entry
    i = bisect.bisect_right(starts, pos) - 1
    return i >= 0 and pos <= ends[i]  # BED half-open; pos is 1-based POS


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--susie-dir", required=True)
    ap.add_argument("--loci", required=True)
    ap.add_argument("--fetal-beds", required=True, nargs="+")
    ap.add_argument("--adult-beds", required=True, nargs="+")
    ap.add_argument("--states", required=True,
                    help="comma-separated regulatory state names")
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    states = set(args.states.split(","))
    fetal = load_bed(args.fetal_beds, states)
    adult = load_bed(args.adult_beds, states)

    with open(args.loci) as f:
        loci = [r for r in csv.DictReader(f, delimiter="\t")
                if r["status"] == "pass"]

    rows = []
    n_missing = 0
    for loc in loci:
        locus_id = loc["locus_id"]
        chrom = loc["chrom"]
        cs_path = os.path.join(args.susie_dir, f"{locus_id}.cs.tsv")
        if not os.path.exists(cs_path):
            n_missing += 1
            continue
        with open(cs_path) as f:
            cs = list(csv.DictReader(f, delimiter="\t"))
        if not cs:
            rows.append({"locus_id": locus_id, "n_cs_variants": 0,
                         "total_pip": "", "fetal_reg_pip": "",
                         "adult_reg_pip": "", "any_fetal_reg": "",
                         "any_adult_reg": "", "fetal_only_reg": ""})
            continue
        tot = fet = adu = 0.0
        any_f = any_a = any_f_only = False
        for v in cs:
            pip = float(v["pip"])
            pos = int(v["pos"])
            f_hit = in_region(fetal, chrom, pos)
            a_hit = in_region(adult, chrom, pos)
            tot += pip
            fet += pip * f_hit
            adu += pip * a_hit
            any_f |= f_hit
            any_a |= a_hit
            any_f_only |= (f_hit and not a_hit)
        assert tot > 0
        rows.append({"locus_id": locus_id, "n_cs_variants": len(cs),
                     "total_pip": round(tot, 4),
                     "fetal_reg_pip": round(fet / tot, 4),
                     "adult_reg_pip": round(adu / tot, 4),
                     "any_fetal_reg": int(any_f),
                     "any_adult_reg": int(any_a),
                     "fetal_only_reg": int(any_f_only)})

    assert n_missing == 0, f"{n_missing} loci missing susie cs files"
    with open(args.out, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()), delimiter="\t")
        w.writeheader()
        w.writerows(rows)
    print(f"annotated {len(rows)} loci "
          f"({sum(1 for r in rows if r['n_cs_variants'] == 0)} without CS)")


if __name__ == "__main__":
    main()
