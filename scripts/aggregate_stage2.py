"""Stage 2 aggregation: quantify the four competing explanations for
non-colocalizing SCZ loci.

(a) allelic heterogeneity — GWAS SuSiE credible-set counts; coloc-SuSiE
    "rescues" (loci missed by single-variant coloc.abf but PP4>thr when
    signals are separated);
(b) eQTL power — colocalization vs eQTL sample size across the DLPFC
    ladder, logistic regression on log10(N);
(c) cell-type dilution — Bryois sc-eQTL coloc in loci missed by bulk
    cortex;
(d) fetal/context specificity — Walker fetal coloc + fetal-vs-adult
    chromHMM regulatory annotation of credible sets.

Every expected input file must exist (hard assertion) — missing loci bias
the comparisons. Outputs: explanations.tsv (one row per analysed locus),
stage2_summary.json (headline statistics + tests).
"""
import argparse
import csv
import glob
import json
import os

import numpy as np
import pandas as pd
import scipy.stats as st
import statsmodels.api as sm

# DLPFC-family power ladder: dataset_id -> nominal eQTL N
LADDER = [("QTD000176", 175), ("QTD000051", 479), ("QTD000434", 560),
          ("QTD000075", 586)]
FETAL_DS = "QTD000579"
BULK_CORTEX = ["QTD000171", "MetaBrain_Cortex_EUR"]


def read_coloc_dir(coloc_dir, datasets, loci):
    frames, missing = [], []
    for ds in datasets:
        for locus in loci:
            p = os.path.join(coloc_dir, ds, f"{locus}.tsv")
            if not os.path.exists(p):
                missing.append(p)
                continue
            frames.append(pd.read_csv(p, sep="\t"))
    assert not missing, f"{len(missing)} missing coloc files, e.g. {missing[:5]}"
    return pd.concat(frames, ignore_index=True)


def best_pp4(df):
    ok = df[df["status"] == "ok"]
    if ok.empty:
        return pd.DataFrame(columns=["locus_id", "dataset_id", "pp_h4", "gene"])
    idx = ok.groupby(["locus_id", "dataset_id"])["pp_h4"].idxmax()
    return ok.loc[idx, ["locus_id", "dataset_id", "pp_h4", "gene"]]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--loci", required=True)
    ap.add_argument("--datasets", required=True)
    ap.add_argument("--per-locus-stage1", required=True)
    ap.add_argument("--coloc-dir", required=True)
    ap.add_argument("--coloc-susie-dir", required=True)
    ap.add_argument("--susie-dir", required=True)
    ap.add_argument("--chromhmm", required=True)
    ap.add_argument("--coloc-susie-datasets", required=True,
                    help="comma-separated")
    ap.add_argument("--pp4-threshold", type=float, required=True)
    ap.add_argument("--out-explanations", required=True)
    ap.add_argument("--out-summary", required=True)
    args = ap.parse_args()
    thr = args.pp4_threshold

    loci_df = pd.read_csv(args.loci, sep="\t", dtype={"chrom": str})
    analysed = loci_df[loci_df["status"] == "pass"]["locus_id"].tolist()

    with open(args.datasets) as f:
        registry = [r for r in csv.DictReader(
            (ln for ln in f if not ln.startswith("#")), delimiter="\t")]
    bryois_ids = [d["dataset_id"] for d in registry
                  if d["source_type"] == "bryois"]
    stage2_ids = [d["dataset_id"] for d in registry if d["stage"] == "2"]

    per1 = pd.read_csv(args.per_locus_stage1, sep="\t")
    per1 = per1[per1["analysed"]].set_index("locus_id")

    # ---------------------------------------------------- load all inputs
    g2 = read_coloc_dir(args.coloc_dir, stage2_ids, analysed)
    b2 = best_pp4(g2)
    wide2 = b2.pivot(index="locus_id", columns="dataset_id", values="pp_h4")

    cs_ds = args.coloc_susie_datasets.split(",")
    gs = read_coloc_dir(args.coloc_susie_dir, cs_ds, analysed)
    bs = best_pp4(gs)
    wide_s = bs.pivot(index="locus_id", columns="dataset_id", values="pp_h4")
    wide_s.columns = [f"susie_{c}" for c in wide_s.columns]

    susie_meta = {}
    for locus in analysed:
        p = os.path.join(args.susie_dir, f"{locus}.summary.json")
        assert os.path.exists(p), f"missing susie summary for {locus}"
        with open(p) as f:
            susie_meta[locus] = json.load(f)
    n_cs = pd.Series({l: m["n_cs"] for l, m in susie_meta.items()},
                     name="n_gwas_cs")
    converged = pd.Series({l: m["converged"] for l, m in susie_meta.items()},
                          name="susie_converged")

    chmm = pd.read_csv(args.chromhmm, sep="\t").set_index("locus_id")

    # -------------------------------------------------------- assemble
    ex = loci_df[loci_df["locus_id"].isin(analysed)][
        ["locus_id", "chrom", "index_snp", "top_p"]].set_index("locus_id")
    ex["coloc_any_brain_abf"] = per1["coloc_any_brain"]
    ex["best_pp4_any_brain_abf"] = per1["best_pp4_any_brain"]
    ex = ex.join(n_cs).join(converged)
    ex = ex.join(wide2).join(wide_s).join(
        chmm[["n_cs_variants", "fetal_reg_pip", "adult_reg_pip",
              "any_fetal_reg", "any_adult_reg", "fetal_only_reg"]])

    ex["best_pp4_bryois"] = ex[[c for c in bryois_ids if c in ex]].max(axis=1)
    ex["best_bryois_ct"] = ex[[c for c in bryois_ids if c in ex]].idxmax(axis=1)
    ex["best_pp4_susie"] = ex[[c for c in ex.columns
                               if str(c).startswith("susie_")]].max(axis=1)
    ex["coloc_fetal"] = ex.get(FETAL_DS, pd.Series(index=ex.index)).ge(thr)
    ex["coloc_bryois_any"] = ex["best_pp4_bryois"].ge(thr)
    ex["rescued_by_susie"] = (~ex["coloc_any_brain_abf"].astype(bool)
                              & ex["best_pp4_susie"].ge(thr))

    miss = ~ex["coloc_any_brain_abf"].astype(bool)

    # -------------------------------------------------------- statistics
    s: dict = {"n_analysed": len(ex), "pp4_threshold": thr,
               "n_non_coloc_stage1": int(miss.sum())}

    # (a) heterogeneity
    multi = ex["n_gwas_cs"] >= 2
    tab = pd.crosstab(miss, multi)
    fisher = st.fisher_exact(tab.values) if tab.shape == (2, 2) else (np.nan, np.nan)
    s["heterogeneity"] = {
        "n_cs_distribution": ex["n_gwas_cs"].value_counts().sort_index().to_dict(),
        "frac_multi_cs_non_coloc": float(multi[miss].mean()),
        "frac_multi_cs_coloc": float(multi[~miss].mean()),
        "fisher_or": float(fisher[0]), "fisher_p": float(fisher[1]),
        "n_rescued_by_coloc_susie": int(ex["rescued_by_susie"].sum()),
        "n_susie_not_converged": int((~ex["susie_converged"].astype(bool)).sum()),
    }

    # (b) power ladder (+ MetaBrain from stage 1 as the top rung)
    ladder_stats = []
    rows = []
    for ds, n in LADDER:
        cc = ex[ds].ge(thr)
        ladder_stats.append({"dataset": ds, "n_eqtl": n,
                             "frac_coloc": float(cc.mean()),
                             "n_coloc": int(cc.sum())})
        rows.append(pd.DataFrame({"coloc": cc.astype(float), "log10n": np.log10(n)}))
    mb_cc = per1["coloc_metabrain"].astype(float)
    mb_n = 2683  # de Klein 2023 cortex-EUR max meta N (order of magnitude)
    ladder_stats.append({"dataset": "MetaBrain_Cortex_EUR", "n_eqtl": mb_n,
                         "frac_coloc": float(mb_cc.mean()),
                         "n_coloc": int(mb_cc.sum())})
    rows.append(pd.DataFrame({"coloc": mb_cc, "log10n": np.log10(mb_n)}))
    dd = pd.concat(rows, ignore_index=True).dropna()
    logit = sm.Logit(dd["coloc"], sm.add_constant(dd["log10n"])).fit(disp=0)
    s["power"] = {
        "ladder": ladder_stats,
        "logit_beta_log10n": float(logit.params["log10n"]),
        "logit_p": float(logit.pvalues["log10n"]),
        "logit_or_per_10x_n": float(np.exp(logit.params["log10n"])),
    }

    # (c) cell type: sc-coloc among loci missed by bulk cortex
    bulk_cols = [c for c in BULK_CORTEX if c in per1.columns]
    bulk_hit = (per1[["best_pp4_gtex_cortex", "best_pp4_metabrain"]]
                .max(axis=1).ge(thr))
    sc_only = ex["coloc_bryois_any"] & ~bulk_hit.reindex(ex.index).fillna(False)
    per_ct = {ct: int(ex[ct].ge(thr).sum()) for ct in bryois_ids if ct in ex}
    s["cell_type"] = {
        "n_coloc_any_celltype": int(ex["coloc_bryois_any"].sum()),
        "n_sc_only_vs_bulk_cortex": int(sc_only.sum()),
        "per_celltype_coloc_counts": per_ct,
    }

    # (d) fetal / context specificity
    fetal_only_coloc = ex["coloc_fetal"].fillna(False) & miss
    ok_ann = ex["n_cs_variants"].fillna(0) > 0
    grp_miss = ex.loc[miss & ok_ann, "fetal_reg_pip"].astype(float)
    grp_hit = ex.loc[~miss & ok_ann, "fetal_reg_pip"].astype(float)
    mwu = (st.mannwhitneyu(grp_miss.dropna(), grp_hit.dropna())
           if len(grp_miss) and len(grp_hit) else (np.nan, np.nan))
    f_tab = pd.crosstab(miss[ok_ann], ex.loc[ok_ann, "fetal_only_reg"].astype(float) > 0)
    f_fisher = (st.fisher_exact(f_tab.values) if f_tab.shape == (2, 2)
                else (np.nan, np.nan))
    s["fetal"] = {
        "n_fetal_coloc": int(ex["coloc_fetal"].fillna(False).sum()),
        "n_fetal_coloc_among_non_coloc": int(fetal_only_coloc.sum()),
        "mean_fetal_reg_pip_non_coloc": float(grp_miss.mean()),
        "mean_fetal_reg_pip_coloc": float(grp_hit.mean()),
        "mwu_p_fetal_reg_pip": float(mwu[1]),
        "fetal_only_reg_fisher_or": float(f_fisher[0]),
        "fetal_only_reg_fisher_p": float(f_fisher[1]),
    }

    # candidate ranking for context-specific regulation (Stage 3 shortlist)
    cand = ex[miss].copy()
    cand["context_score"] = (
        cand["coloc_fetal"].fillna(False).astype(int) * 2
        + cand["coloc_bryois_any"].fillna(False).astype(int) * 2
        + cand["fetal_only_reg"].fillna(0).astype(float)
        + (cand["fetal_reg_pip"].fillna(0) - cand["adult_reg_pip"].fillna(0))
          .clip(lower=0)
    )
    ex["context_score"] = cand["context_score"]

    ex.reset_index().to_csv(args.out_explanations, sep="\t", index=False)
    with open(args.out_summary, "w") as f:
        json.dump(s, f, indent=2)
    print(json.dumps({k: v for k, v in s.items()
                      if k in ["heterogeneity", "power", "cell_type", "fetal"]},
                     indent=1)[:2000])


if __name__ == "__main__":
    main()
