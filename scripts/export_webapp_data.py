"""Export the analysis results as JSON for the showcase web app.

Produces webapp/public/data/{loci,nominations,summary}.json from the
canonical results tables. Values are rounded for payload size; the
authoritative numbers remain in the TSV/JSON artifacts.
"""
import argparse
import json
import math

import pandas as pd


def r3(x):
    return None if x is None or (isinstance(x, float) and math.isnan(x)) else round(float(x), 3)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--ledger-table", required=True)
    ap.add_argument("--ledger-json", required=True)
    ap.add_argument("--per-locus-stage1", required=True)
    ap.add_argument("--explanations", required=True)
    ap.add_argument("--loci", required=True)
    ap.add_argument("--nominations", required=True)
    ap.add_argument("--stage1-summary", required=True)
    ap.add_argument("--stage2-summary", required=True)
    ap.add_argument("--outdir", required=True)
    args = ap.parse_args()

    led = pd.read_csv(args.ledger_table, sep="\t").set_index("locus_id")
    per1 = pd.read_csv(args.per_locus_stage1, sep="\t")
    per1 = per1[per1["analysed"]].set_index("locus_id")
    ex = pd.read_csv(args.explanations, sep="\t").set_index("locus_id")
    meta = pd.read_csv(args.loci, sep="\t", dtype={"chrom": str}).set_index("locus_id")
    nom = pd.read_csv(args.nominations, sep="\t")

    nom_high = nom[nom["tier"] == "high"]
    nom_counts = nom_high.groupby("locus_id").size()
    nom_top = nom_high.loc[
        nom_high.groupby("locus_id")["chain_score"].idxmax()
    ].set_index("locus_id")

    loci_out = []
    for lid in led.index:
        l, p, e, m = led.loc[lid], per1.loc[lid], ex.loc[lid], meta.loc[lid]
        loci_out.append({
            "id": lid,
            "chrom": m["chrom"],
            "pos": int(m["index_pos_hg38"]),
            "indexSnp": m["index_snp"],
            "topP": float(m["top_p"]),
            "attribution": l["attributed_to"],
            "channels": {
                "bulk": r3(p["best_pp4_any_brain"]),
                "susie": r3(e["best_pp4_susie"]),
                "sc": r3(e["best_pp4_bryois"]),
                "fetal": r3(e.get("QTD000579")),
                "sqtl": r3(l["best_pp4_sqtl"]),
                "meqtl": r3(l["best_pp4_meqtl"]),
            },
            "bestBulkGene": (None if pd.isna(p.get("best_gene_any_brain"))
                             else p["best_gene_any_brain"]),
            "bestScCt": (None if pd.isna(e.get("best_bryois_ct"))
                         else str(e["best_bryois_ct"]).replace("Bryois_", "")),
            "nGwasCs": (None if pd.isna(e["n_gwas_cs"]) else int(e["n_gwas_cs"])),
            "fetalRegPip": r3(e.get("fetal_reg_pip")),
            "adultRegPip": r3(e.get("adult_reg_pip")),
            "nNominations": int(nom_counts.get(lid, 0)),
            "topNomination": (None if lid not in nom_top.index
                              else {"gene": nom_top.loc[lid, "gene_symbol"],
                                    "score": r3(nom_top.loc[lid, "chain_score"])}),
        })

    nom_out = []
    for _, r in nom.iterrows():
        nom_out.append({
            "locusId": r["locus_id"],
            "orphan": bool(r["expression_orphan_locus"]),
            "gene": r["gene"],
            "symbol": (r["gene_symbol"] if isinstance(r["gene_symbol"], str)
                       else r.get("gene_name_gencode")),
            "tier": r["tier"],
            "score": r3(r["chain_score"]),
            "cpg": r["cpg"],
            "cpgGwasPp4": r3(r["cpg_gwas_pp4"]),
            "cpgGenePp4": r3(r["pp_h4"]),
            "tssDist": (None if pd.isna(r["cpg_tss_dist"])
                        else int(r["cpg_tss_dist"])),
            "directPp4": r3(r["direct_expression_pp4"]),
        })

    with open(args.ledger_json) as f:
        ledger = json.load(f)
    with open(args.stage1_summary) as f:
        s1 = json.load(f)
    with open(args.stage2_summary) as f:
        s2 = json.load(f)
    summary = {
        "nLoci": ledger["n_analysed"],
        "ledger": ledger["sequential_ledger"],
        "nUnexplained": ledger["n_unexplained_final"],
        "stage1Fractions": s1["fractions"],
        "power": s2["power"],
        "eur": ledger["eur_sensitivity"],
        "nominations": {
            "lociAny": int(nom["locus_id"].nunique()),
            "lociHigh": int(nom_high["locus_id"].nunique()),
            "orphanHigh": int(nom_high[nom_high["expression_orphan_locus"]]
                              ["locus_id"].nunique()),
        },
    }

    import os
    os.makedirs(args.outdir, exist_ok=True)
    for name, obj in [("loci", loci_out), ("nominations", nom_out),
                      ("summary", summary)]:
        with open(f"{args.outdir}/{name}.json", "w") as f:
            json.dump(obj, f, separators=(",", ":"))
        print(f"{name}.json: {len(json.dumps(obj)) // 1024} KB")


if __name__ == "__main__":
    main()
