"""Aggregate CpG->gene chains into per-locus gene nominations.

For every locus with a GWAS<->CpG colocalization, each candidate gene's
chain score is min(GWAS<->CpG PP4, CpG<->gene PP4), maximized over
colocalizing CpGs. Tiers: high (>=0.8), suggestive (>=0.5). Each
nomination also carries its best DIRECT GWAS<->expression PP4 (stage 1,
subthreshold support) and the top CpG's distance to the gene's TSS.
"""
import argparse
import glob
import json
import os

import pandas as pd


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--chain-dir", required=True)
    ap.add_argument("--tss", required=True)
    ap.add_argument("--ledger", required=True)
    ap.add_argument("--gene-level", required=True)
    ap.add_argument("--meqtl-dir", required=True)
    ap.add_argument("--meqtl-region-dir", required=True)
    ap.add_argument("--loci", required=True)
    ap.add_argument("--pp4-threshold", type=float, required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--out-summary", required=True)
    args = ap.parse_args()

    led = pd.read_csv(args.ledger, sep="\t").set_index("locus_id")
    loci = led.index.tolist()

    tss = pd.read_csv(args.tss, sep="\t", header=None,
                      names=["chrom", "tss", "gene_id", "gene_name", "gene_type"])
    tss_by_gene = tss.drop_duplicates("gene_id").set_index("gene_id")

    gl = pd.read_csv(args.gene_level, sep="\t", low_memory=False)
    gl_ok = gl[gl["status"] == "ok"]
    direct = gl_ok.groupby(["locus_id", "gene"])["pp_h4"].max()

    frames = []
    n_missing = 0
    for locus in loci:
        p = os.path.join(args.chain_dir, f"{locus}.tsv")
        if not os.path.exists(p):
            n_missing += 1
            continue
        frames.append(pd.read_csv(p, sep="\t"))
    assert n_missing == 0, f"{n_missing} chain files missing"
    ch = pd.concat(frames, ignore_index=True)
    ok = ch[ch["status"] == "ok"].copy()
    ok["chain_score"] = ok[["cpg_gwas_pp4", "pp_h4"]].min(axis=1)

    # best chain per locus x gene (max over CpGs)
    idx = ok.groupby(["locus_id", "gene"])["chain_score"].idxmax()
    best = ok.loc[idx].copy()

    # CpG hg19 positions for TSS distances
    cpg_pos = {}
    for locus in best["locus_id"].unique():
        rp = os.path.join(args.meqtl_region_dir, f"{locus}.tsv")
        df = pd.read_csv(rp, sep="\t", usecols=["Probe", "Probe_bp"])
        cpg_pos.update(df.drop_duplicates("Probe")
                       .set_index("Probe")["Probe_bp"].to_dict())

    best["cpg_pos_hg19"] = best["cpg"].map(cpg_pos)
    best["gene_tss_hg19"] = best["gene"].map(tss_by_gene["tss"])
    best["gene_name_gencode"] = best["gene"].map(tss_by_gene["gene_name"])
    best["cpg_tss_dist"] = (best["cpg_pos_hg19"] - best["gene_tss_hg19"]).abs()
    best["direct_expression_pp4"] = [
        direct.get((l, g), float("nan"))
        for l, g in zip(best["locus_id"], best["gene"])]
    best["tier"] = pd.cut(best["chain_score"], [0.5, 0.8, 1.01],
                          labels=["suggestive", "high"], right=False)
    best = best[best["chain_score"] >= 0.5].copy()
    best["expression_orphan_locus"] = ~best["locus_id"].map(
        led["bulk_expression"]).astype(bool)

    cols = ["locus_id", "expression_orphan_locus", "gene",
            "gene_symbol", "gene_name_gencode", "tier", "chain_score",
            "cpg", "cpg_gwas_pp4", "pp_h4", "n_shared", "cpg_tss_dist",
            "direct_expression_pp4"]
    best = best.sort_values(["locus_id", "chain_score"],
                            ascending=[True, False])[cols]
    best.to_csv(args.out, sep="\t", index=False)

    high = best[best["tier"] == "high"]
    orph = best[best["expression_orphan_locus"]]
    summary = {
        "n_loci_with_any_nomination": int(best["locus_id"].nunique()),
        "n_loci_with_high_tier": int(high["locus_id"].nunique()),
        "n_genes_high_tier": int(high["gene"].nunique()),
        "n_expression_orphan_loci_with_nomination": int(
            orph["locus_id"].nunique()),
        "n_expression_orphan_loci_with_high_tier": int(
            orph[orph["tier"] == "high"]["locus_id"].nunique()),
        "median_high_tier_direct_expression_pp4": float(
            high["direct_expression_pp4"].median()),
    }
    with open(args.out_summary, "w") as f:
        json.dump(summary, f, indent=2)
    print(json.dumps(summary, indent=1))


if __name__ == "__main__":
    main()
