"""Final cross-channel ledger: expression + splicing + methylation
colocalization, EUR-ancestry sensitivity, and fetal-mQTL enrichment.

Sequential attribution order (fixed a priori, coarse-to-fine): bulk
expression -> multi-signal rescue -> single-cell -> fetal eQTL ->
splicing -> methylation. Each locus is attributed to the FIRST channel
that explains it; 'unexplained' survives all six.
"""
import argparse
import csv
import json
import os

import pandas as pd
import scipy.stats as st


def best_pp4_per_locus(coloc_dir, datasets, loci):
    out = {}
    for ds in datasets:
        vals = []
        for l in loci:
            p = os.path.join(coloc_dir, ds, f"{l}.tsv")
            assert os.path.exists(p), p
            df = pd.read_csv(p, sep="\t")
            ok = df[df["status"] == "ok"]
            vals.append(ok["pp_h4"].max() if len(ok) else float("nan"))
        out[ds] = pd.Series(vals, index=loci)
    return pd.DataFrame(out)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--per-locus-stage1", required=True)
    ap.add_argument("--explanations", required=True)
    ap.add_argument("--datasets", required=True)
    ap.add_argument("--coloc-dir", required=True)
    ap.add_argument("--coloc-eur-dir", required=True)
    ap.add_argument("--fetal-mqtl", required=True)
    ap.add_argument("--pp4-threshold", type=float, required=True)
    ap.add_argument("--out-json", required=True)
    ap.add_argument("--out-table", required=True)
    args = ap.parse_args()
    thr = args.pp4_threshold

    per1 = pd.read_csv(args.per_locus_stage1, sep="\t")
    an = per1[per1["analysed"]].set_index("locus_id")
    loci = an.index.tolist()
    ex = pd.read_csv(args.explanations, sep="\t").set_index("locus_id")
    ex = ex.reindex(loci)

    with open(args.datasets) as f:
        reg = [r for r in csv.DictReader(
            (ln for ln in f if not ln.startswith("#")), delimiter="\t")]
    sqtl_ids = [r["dataset_id"] for r in reg if r["stage"] == "sqtl"]

    sq = best_pp4_per_locus(args.coloc_dir, sqtl_ids, loci)
    me = best_pp4_per_locus(args.coloc_dir, ["Brain_mMeta_meQTL"], loci)

    # ------------------------------------------------ sequential ledger
    t = pd.DataFrame(index=loci)
    t["bulk_expression"] = an["coloc_any_brain"].astype(bool)
    t["susie_rescue"] = ex["rescued_by_susie"].fillna(False).astype(bool)
    t["single_cell"] = ex["coloc_bryois_any"].fillna(False).astype(bool)
    t["fetal_eqtl"] = ex["coloc_fetal"].fillna(False).astype(bool)
    t["splicing"] = (sq >= thr).any(axis=1)
    t["methylation"] = (me >= thr).any(axis=1)
    t["best_pp4_sqtl"] = sq.max(axis=1)
    has_sq = sq.notna().any(axis=1)
    t["best_sqtl_ds"] = pd.NA
    t.loc[has_sq, "best_sqtl_ds"] = sq[has_sq].idxmax(axis=1)
    t["best_pp4_meqtl"] = me["Brain_mMeta_meQTL"]

    order = ["bulk_expression", "susie_rescue", "single_cell",
             "fetal_eqtl", "splicing", "methylation"]
    attributed = pd.Series("unexplained", index=loci)
    remaining = pd.Series(True, index=loci)
    ledger = []
    for ch in order:
        newly = remaining & t[ch]
        ledger.append({"channel": ch, "newly_explained": int(newly.sum()),
                       "total_hits": int(t[ch].sum())})
        attributed[newly] = ch
        remaining &= ~t[ch]
    t["attributed_to"] = attributed
    n_unexp = int(remaining.sum())

    # ------------------------------------------------ EUR sensitivity
    eur = {}
    for ds, col in [("QTD000171", "best_pp4_gtex_cortex"),
                    ("MetaBrain_Cortex_EUR", "best_pp4_metabrain")]:
        e = best_pp4_per_locus(args.coloc_eur_dir, [ds], loci)[ds]
        prim = an[col]
        both = pd.DataFrame({"primary": prim, "eur": e}).dropna()
        agree = ((both["primary"] >= thr) == (both["eur"] >= thr)).mean()
        eur[ds] = {
            "n_coloc_primary": int((prim >= thr).sum()),
            "n_coloc_eur": int((e >= thr).sum()),
            "classification_agreement": float(agree),
            "spearman_pp4": float(both["primary"].corr(both["eur"],
                                                        method="spearman")),
        }

    # ------------------------------------- fetal mQTL overlap enrichment
    fm = pd.read_csv(args.fetal_mqtl, sep="\t").set_index("locus_id")
    fm = fm.reindex(loci)
    ok_ann = fm["n_cs_variants"].fillna(0) > 0
    miss = ~t["bulk_expression"]
    tab = pd.crosstab(miss[ok_ann], fm.loc[ok_ann, "any_fetal_mqtl"] == 1)
    fisher = (st.fisher_exact(tab.values) if tab.shape == (2, 2)
              else (float("nan"), float("nan")))

    summary = {
        "n_analysed": len(loci), "pp4_threshold": thr,
        "sequential_ledger": ledger,
        "n_unexplained_final": n_unexp,
        "frac_unexplained_final": n_unexp / len(loci),
        "meqtl": {
            "n_coloc": int(t["methylation"].sum()),
            "n_among_bulk_expression_misses": int(
                (t["methylation"] & ~t["bulk_expression"]).sum()),
        },
        "eur_sensitivity": eur,
        "fetal_mqtl_overlap": {
            "n_loci_any_hit": int((fm["any_fetal_mqtl"] == 1).sum()),
            "fisher_or_miss_vs_hit": float(fisher[0]),
            "fisher_p": float(fisher[1]),
        },
    }
    with open(args.out_json, "w") as f:
        json.dump(summary, f, indent=2)
    t.reset_index(names="locus_id").to_csv(args.out_table, sep="\t",
                                           index=False)
    print(json.dumps(summary, indent=1))


if __name__ == "__main__":
    main()
