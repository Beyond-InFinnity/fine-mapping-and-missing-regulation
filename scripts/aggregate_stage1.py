"""Aggregate per-locus x per-dataset coloc results into Stage 1 deliverables.

Derives the expected file set from the loci table and dataset registry
itself (single source of truth) and ASSERTS every expected result file
exists — a silently missing locus would bias the colocalization fraction
downward, which is exactly the quantity under study.

Outputs:
  coloc_gene_level.tsv.gz : all gene-level coloc rows, concatenated
  per_locus_table.tsv     : one row per locus (287), wide per-dataset columns
  summary.json            : headline fractions with Wilson 95% CIs
"""
import argparse
import csv
import json
import math
import os

import pandas as pd


def wilson_ci(k: int, n: int, z: float = 1.959964) -> tuple[float, float]:
    if n == 0:
        return (float("nan"), float("nan"))
    p = k / n
    denom = 1 + z**2 / n
    centre = (p + z**2 / (2 * n)) / denom
    half = z * math.sqrt(p * (1 - p) / n + z**2 / (4 * n**2)) / denom
    return (max(0.0, centre - half), min(1.0, centre + half))


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--loci", required=True)
    ap.add_argument("--datasets", required=True)
    ap.add_argument("--coloc-dir", required=True)
    ap.add_argument("--locus-filter", default="",
                    help="comma-separated locus ids; empty = all pass loci")
    ap.add_argument("--pp4-threshold", type=float, required=True)
    ap.add_argument("--gtex-cortex-id", required=True)
    ap.add_argument("--metabrain-id", required=True)
    ap.add_argument("--out-gene-level", required=True)
    ap.add_argument("--out-per-locus", required=True)
    ap.add_argument("--out-summary", required=True)
    args = ap.parse_args()

    loci = pd.read_csv(args.loci, sep="\t", dtype={"chrom": str})
    with open(args.datasets) as f:
        datasets = [r for r in csv.DictReader(
            (ln for ln in f if not ln.startswith("#")), delimiter="\t")]
    stage1 = [d for d in datasets if d["stage"] == "1"]
    ds_ids = [d["dataset_id"] for d in stage1]
    labels = {d["dataset_id"]: d["label"] for d in stage1}
    gtex_ids = [d["dataset_id"] for d in stage1
                if d["source_type"] == "eqtl_catalogue"]
    assert args.gtex_cortex_id in gtex_ids
    assert args.metabrain_id in ds_ids

    analysed = loci[loci["status"] == "pass"]["locus_id"].tolist()
    if args.locus_filter:
        keep = set(args.locus_filter.split(","))
        unknown = keep - set(analysed)
        assert not unknown, f"locus_filter ids not in pass loci: {unknown}"
        analysed = [l for l in analysed if l in keep]
    assert analysed, "no analysable loci"

    # ---------------------------------------------------------------- load
    missing = []
    frames = []
    for ds in ds_ids:
        for locus in analysed:
            path = os.path.join(args.coloc_dir, ds, f"{locus}.tsv")
            if not os.path.exists(path):
                missing.append(path)
                continue
            frames.append(pd.read_csv(path, sep="\t"))
    assert not missing, f"{len(missing)} expected coloc results missing, e.g. {missing[:5]}"

    gene_level = pd.concat(frames, ignore_index=True)
    expected_pairs = len(ds_ids) * len(analysed)
    got_pairs = gene_level.groupby(["dataset_id", "locus_id"]).ngroups
    assert got_pairs == expected_pairs, (got_pairs, expected_pairs)
    gene_level.to_csv(args.out_gene_level, sep="\t", index=False)

    # ------------------------------------------------------------ per locus
    ok = gene_level[gene_level["status"] == "ok"].copy()
    per = loci.copy()

    def best_pp4_block(sub: pd.DataFrame, suffix: str) -> pd.DataFrame:
        if sub.empty:
            return pd.DataFrame(columns=[f"best_pp4_{suffix}",
                                         f"best_gene_{suffix}",
                                         f"n_genes_ok_{suffix}"])
        idx = sub.groupby("locus_id")["pp_h4"].idxmax()
        best = sub.loc[idx, ["locus_id", "pp_h4", "gene"]].set_index("locus_id")
        best.columns = [f"best_pp4_{suffix}", f"best_gene_{suffix}"]
        best[f"n_genes_ok_{suffix}"] = sub.groupby("locus_id").size()
        return best

    for ds in ds_ids:
        per = per.merge(best_pp4_block(ok[ok["dataset_id"] == ds], labels[ds]),
                        how="left", left_on="locus_id", right_index=True)

    per = per.merge(
        best_pp4_block(ok[ok["dataset_id"] == args.gtex_cortex_id], "gtex_cortex")
        .drop(columns=["n_genes_ok_gtex_cortex"]),
        how="left", left_on="locus_id", right_index=True)
    per = per.merge(
        best_pp4_block(ok[ok["dataset_id"] == args.metabrain_id], "metabrain")
        .drop(columns=["n_genes_ok_metabrain"]),
        how="left", left_on="locus_id", right_index=True)
    per = per.merge(
        best_pp4_block(ok[ok["dataset_id"].isin(gtex_ids)], "any_gtex_brain")
        .drop(columns=["n_genes_ok_any_gtex_brain"]),
        how="left", left_on="locus_id", right_index=True)
    per = per.merge(
        best_pp4_block(ok, "any_brain").drop(columns=["n_genes_ok_any_brain"]),
        how="left", left_on="locus_id", right_index=True)

    thr = args.pp4_threshold
    analysed_mask = per["locus_id"].isin(analysed)
    per["analysed"] = analysed_mask
    for suffix in ["gtex_cortex", "metabrain", "any_gtex_brain", "any_brain"]:
        per[f"coloc_{suffix}"] = per[f"best_pp4_{suffix}"].ge(thr) & analysed_mask
    per.to_csv(args.out_per_locus, sep="\t", index=False)

    # -------------------------------------------------------------- summary
    n = int(analysed_mask.sum())
    summary = {
        "n_loci_total": int(len(loci)),
        "n_loci_analysed": n,
        "n_loci_excluded_mhc": int((loci["status"] == "excluded_mhc").sum()),
        "n_loci_skipped_chrX": int((loci["status"] == "skipped_chrX").sum()),
        "pp4_threshold": thr,
        "datasets": {d["dataset_id"]: {"label": d["label"],
                                       "sample_size": d["sample_size"]}
                     for d in stage1},
        "fractions": {},
    }
    for suffix in ["gtex_cortex", "metabrain", "any_gtex_brain", "any_brain"]:
        k = int(per.loc[analysed_mask, f"coloc_{suffix}"].sum())
        lo, hi = wilson_ci(k, n)
        summary["fractions"][suffix] = {
            "n_colocalized": k, "n_analysed": n, "fraction": k / n,
            "wilson95_lo": lo, "wilson95_hi": hi,
        }
    with open(args.out_summary, "w") as f:
        json.dump(summary, f, indent=2)
    print(json.dumps(summary["fractions"], indent=2))


if __name__ == "__main__":
    main()
