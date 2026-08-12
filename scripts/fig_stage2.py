"""Stage 2 summary figure: the four explanations side by side.

A: eQTL power ladder — colocalization fraction vs eQTL sample size
B: single-variant coloc.abf vs multi-signal coloc-SuSiE (rescues)
C: GWAS credible-set count by Stage-1 colocalization status
D: fetal-regulatory PIP fraction by colocalization status

Palette: project viz roles; the two-group split (colocalized vs not)
keeps fixed hues across panels C/D — blue = colocalized, orange = not.
"""
import argparse
import json

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

SURFACE = "#fcfcfb"
INK = "#0b0b0b"
INK2 = "#52514e"
MUTED = "#898781"
GRID = "#e1e0d9"
BASELINE = "#c3c2b7"
BLUE = "#2a78d6"    # colocalized / primary series
ORANGE = "#eb6834"  # non-colocalized

LADDER_LABELS = {"QTD000176": "GTEx DLPFC", "QTD000051": "BrainSeq",
                 "QTD000434": "ROSMAP", "QTD000075": "CommonMind",
                 "MetaBrain_Cortex_EUR": "MetaBrain"}


def style_axis(ax):
    ax.set_facecolor(SURFACE)
    ax.grid(True, color=GRID, linewidth=0.8, zorder=0)
    ax.set_axisbelow(True)
    for sp in ["top", "right"]:
        ax.spines[sp].set_visible(False)
    for sp in ["bottom", "left"]:
        ax.spines[sp].set_color(BASELINE)
    ax.tick_params(labelsize=8.5, colors=MUTED, length=0)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--explanations", required=True)
    ap.add_argument("--summary", required=True)
    ap.add_argument("--out-prefix", required=True)
    args = ap.parse_args()

    ex = pd.read_csv(args.explanations, sep="\t")
    with open(args.summary) as f:
        s = json.load(f)
    thr = s["pp4_threshold"]
    miss = ~ex["coloc_any_brain_abf"].astype(bool)

    fig, axes = plt.subplots(2, 2, figsize=(11.5, 8.6), facecolor=SURFACE,
                             gridspec_kw={"hspace": 0.42, "wspace": 0.3})
    (ax_a, ax_b), (ax_c, ax_d) = axes

    # ------------------------------------------------------------ Panel A
    style_axis(ax_a)
    lad = pd.DataFrame(s["power"]["ladder"])
    ax_a.plot(lad["n_eqtl"], lad["frac_coloc"], color=BLUE, linewidth=2,
              zorder=3)
    ax_a.scatter(lad["n_eqtl"], lad["frac_coloc"], s=42, color=BLUE, zorder=4)
    for _, r in lad.iterrows():
        ax_a.annotate(LADDER_LABELS.get(r["dataset"], r["dataset"]),
                      (r["n_eqtl"], r["frac_coloc"]),
                      textcoords="offset points", xytext=(6, 6),
                      fontsize=8, color=INK2)
    ax_a.set_xscale("log")
    ax_a.set_xlabel("eQTL sample size (log scale)", fontsize=9.5, color=INK2)
    ax_a.set_ylabel(f"Fraction of loci PP4 > {thr:g}", fontsize=9.5, color=INK2)
    beta = s["power"]["logit_or_per_10x_n"]
    pv = s["power"]["logit_p"]
    ax_a.set_title(f"A   Power: OR {beta:.1f} per 10× eQTL N (p={pv:.1e})",
                   loc="left", fontsize=11, color=INK, pad=10)

    # ------------------------------------------------------------ Panel B
    style_axis(ax_b)
    susie_cols = [c for c in ex.columns if str(c).startswith("susie_QTD")]
    abf_counterparts = [c.replace("susie_", "") for c in susie_cols]
    abf_present = [c for c in abf_counterparts if c in ex.columns]
    x = ex[abf_present].max(axis=1).fillna(0)
    y = ex["best_pp4_susie"].fillna(0)
    ax_b.axvline(thr, color=MUTED, linewidth=0.9, linestyle=(0, (4, 3)), zorder=1)
    ax_b.axhline(thr, color=MUTED, linewidth=0.9, linestyle=(0, (4, 3)), zorder=1)
    ax_b.scatter(x, y, s=20, color=BLUE, alpha=0.5, linewidths=0, zorder=3)
    n_rescued = int(s["heterogeneity"]["n_rescued_by_coloc_susie"])
    ax_b.text(0.03, 0.97, f"rescued by multi-signal: {n_rescued}",
              transform=ax_b.transAxes, fontsize=8.5, color=INK2, va="top")
    ax_b.set_xlim(-0.02, 1.02)
    ax_b.set_ylim(-0.02, 1.02)
    ax_b.set_xlabel("Best PP4, coloc.abf (same 6 datasets)", fontsize=9.5,
                    color=INK2)
    ax_b.set_ylabel("Best PP4, coloc-SuSiE", fontsize=9.5, color=INK2)
    ax_b.set_title("B   Single-variant vs multi-signal colocalization",
                   loc="left", fontsize=11, color=INK, pad=10)

    # ------------------------------------------------------------ Panel C
    style_axis(ax_c)
    max_cs = int(ex["n_gwas_cs"].max())
    xs = np.arange(0, max_cs + 1)
    w = 0.38
    for off, mask, color, label in [(-w / 2, ~miss, BLUE, "colocalized"),
                                    (w / 2, miss, ORANGE, "not colocalized")]:
        counts = (ex.loc[mask, "n_gwas_cs"].value_counts()
                  .reindex(xs, fill_value=0))
        frac = counts / max(1, counts.sum())
        ax_c.bar(xs + off, frac, width=w, color=color, label=label, zorder=3)
    ax_c.set_xticks(xs)
    ax_c.set_xlabel("GWAS SuSiE credible sets per locus", fontsize=9.5,
                    color=INK2)
    ax_c.set_ylabel("Fraction of loci", fontsize=9.5, color=INK2)
    leg = ax_c.legend(frameon=False, fontsize=8.5, loc="upper right")
    for t in leg.get_texts():
        t.set_color(INK2)
    fp = s["heterogeneity"]["fisher_p"]
    ax_c.set_title(f"C   Allelic heterogeneity (multi-CS Fisher p={fp:.2g})",
                   loc="left", fontsize=11, color=INK, pad=10)

    # ------------------------------------------------------------ Panel D
    style_axis(ax_d)
    ok_ann = ex["n_cs_variants"].fillna(0) > 0
    groups = [ex.loc[~miss & ok_ann, "fetal_reg_pip"].dropna(),
              ex.loc[miss & ok_ann, "fetal_reg_pip"].dropna()]
    bp = ax_d.boxplot(groups, positions=[1, 2], widths=0.5,
                      patch_artist=True, showfliers=False,
                      medianprops=dict(color=INK, linewidth=1.4))
    for patch, color in zip(bp["boxes"], [BLUE, ORANGE]):
        patch.set_facecolor(color)
        patch.set_alpha(0.75)
        patch.set_edgecolor("none")
    for i, g in enumerate(groups, start=1):
        jitter = np.random.default_rng(7).uniform(-0.12, 0.12, len(g))
        ax_d.scatter(np.full(len(g), i) + jitter, g, s=8, color=INK2,
                     alpha=0.35, linewidths=0, zorder=4)
    ax_d.set_xticks([1, 2])
    ax_d.set_xticklabels(["colocalized", "not colocalized"], fontsize=9,
                         color=INK)
    ax_d.set_ylabel("PIP-weighted fraction of credible set\nin fetal regulatory chromatin",
                    fontsize=9, color=INK2)
    mp = s["fetal"]["mwu_p_fetal_reg_pip"]
    ax_d.set_title(f"D   Fetal regulatory annotation (MWU p={mp:.2g})",
                   loc="left", fontsize=11, color=INK, pad=10)

    fig.savefig(f"{args.out_prefix}.png", dpi=200, bbox_inches="tight",
                facecolor=SURFACE)
    fig.savefig(f"{args.out_prefix}.pdf", bbox_inches="tight",
                facecolor=SURFACE)
    print(f"wrote {args.out_prefix}.png/.pdf")


if __name__ == "__main__":
    main()
