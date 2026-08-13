"""Evidence matrix: loci x channels heatmap of best PP4, rows grouped by
final attribution, plus a marginal bar of per-channel totals."""
import argparse

import matplotlib
matplotlib.use("Agg")
import matplotlib.colors as mcolors
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

CHANNELS = [
    ("best_pp4_any_brain", "Bulk expression"),
    ("best_pp4_susie", "coloc-SuSiE"),
    ("best_pp4_bryois", "Single-cell"),
    ("fetal_pp4", "Fetal eQTL"),
    ("best_pp4_sqtl", "Splicing"),
    ("best_pp4_meqtl", "Methylation"),
]
ATTR_ORDER = ["bulk_expression", "susie_rescue", "single_cell",
              "fetal_eqtl", "splicing", "methylation", "unexplained"]
ATTR_COLORS = {"bulk_expression": "#2a78d6", "susie_rescue": "#5598e7",
               "single_cell": "#1baf7a", "fetal_eqtl": "#eda100",
               "splicing": "#eb6834", "methylation": "#7b2d8b",
               "unexplained": "#b8b8b8"}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--ledger-table", required=True)
    ap.add_argument("--per-locus-stage1", required=True)
    ap.add_argument("--explanations", required=True)
    ap.add_argument("--out-prefix", required=True)
    args = ap.parse_args()

    led = pd.read_csv(args.ledger_table, sep="\t").set_index("locus_id")
    per1 = pd.read_csv(args.per_locus_stage1, sep="\t")
    per1 = per1[per1["analysed"]].set_index("locus_id")
    ex = pd.read_csv(args.explanations, sep="\t").set_index("locus_id")

    m = pd.DataFrame(index=led.index)
    m["best_pp4_any_brain"] = per1["best_pp4_any_brain"]
    m["best_pp4_susie"] = ex["best_pp4_susie"]
    m["best_pp4_bryois"] = ex["best_pp4_bryois"]
    m["fetal_pp4"] = ex["QTD000579"]
    m["best_pp4_sqtl"] = led["best_pp4_sqtl"]
    m["best_pp4_meqtl"] = led["best_pp4_meqtl"]
    m["attr"] = led["attributed_to"]

    m["attr_rank"] = m["attr"].map({a: i for i, a in enumerate(ATTR_ORDER)})
    m = m.sort_values(["attr_rank", "best_pp4_any_brain"],
                      ascending=[True, False])

    vals = m[[c for c, _ in CHANNELS]].to_numpy(dtype=float)
    cmap = mcolors.LinearSegmentedColormap.from_list(
        "pp4", ["#f5f4f1", "#c5d9f2", "#2a78d6", "#0d366b"])
    cmap.set_bad("#ffffff")

    fig = plt.figure(figsize=(4.6, 7.2), dpi=300, constrained_layout=True)
    gs = fig.add_gridspec(2, 2, height_ratios=[0.06, 1.0],
                          width_ratios=[0.035, 1.0])
    ax = fig.add_subplot(gs[1, 1])
    axa = fig.add_subplot(gs[1, 0], sharey=ax)
    axt = fig.add_subplot(gs[0, 1], sharex=ax)

    im = ax.imshow(vals, aspect="auto", cmap=cmap, vmin=0, vmax=1,
                   interpolation="nearest")
    ax.set_xticks(range(len(CHANNELS)))
    ax.set_xticklabels([l for _, l in CHANNELS], fontsize=6.5, rotation=35,
                       ha="right")
    ax.set_yticks([])
    ax.tick_params(length=0)

    attr_colors = m["attr"].map(ATTR_COLORS).tolist()
    axa.imshow(np.array([mcolors.to_rgb(c) for c in attr_colors])
               .reshape(-1, 1, 3), aspect="auto", interpolation="nearest")
    axa.set_xticks([])
    axa.set_yticks([])
    axa.set_ylabel("281 loci, grouped by attribution", fontsize=7)

    totals = (m[[c for c, _ in CHANNELS]] >= 0.8).sum()
    axt.bar(range(len(CHANNELS)), totals, width=0.6, color="#2a78d6")
    for i, v in enumerate(totals):
        axt.text(i, v + 3, str(v), ha="center", fontsize=6)
    axt.set_ylim(0, totals.max() * 1.3)
    axt.set_yticks([])
    axt.tick_params(length=0, labelbottom=False)
    for sp in axt.spines.values():
        sp.set_visible(False)
    axt.set_title("Loci with PP4 > 0.8, per channel", fontsize=7, loc="left")

    handles = [plt.Rectangle((0, 0), 1, 1, color=ATTR_COLORS[a])
               for a in ATTR_ORDER]
    fig.legend(handles, ["bulk expression", "multi-signal rescue",
                         "single-cell", "fetal", "splicing", "methylation",
                         "unexplained"],
               loc="outside lower center", ncol=4, fontsize=6, frameon=False,
               title="final attribution", title_fontsize=6.5)
    cbar = fig.colorbar(im, ax=ax, shrink=0.35, pad=0.02)
    cbar.set_label("best PP4", fontsize=6.5)
    cbar.ax.tick_params(labelsize=6)

    fig.savefig(f"{args.out_prefix}.pdf")
    fig.savefig(f"{args.out_prefix}.png", dpi=300)
    print(f"wrote {args.out_prefix}.pdf/.png")


if __name__ == "__main__":
    main()
