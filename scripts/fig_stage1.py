"""Stage 1 summary figure.

Panel A: fraction of analysable PGC3 SCZ loci with best PP4 > threshold,
         per dataset class, with Wilson 95% CIs.
Panel B: per-locus best PP4, GTEx cortex vs MetaBrain cortex — the
         dataset-level agreement behind the headline fractions.

Static, light-mode, publication-style. Colors follow the project viz
palette (single data hue + neutral ink/grid roles; no multi-series
palette, so direct labels replace a legend).
"""
import argparse
import json

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd

SURFACE = "#fcfcfb"
INK = "#0b0b0b"
INK2 = "#52514e"
MUTED = "#898781"
GRID = "#e1e0d9"
BASELINE = "#c3c2b7"
BLUE = "#2a78d6"

CLASS_LABELS = {
    "gtex_cortex": "GTEx cortex (N=205)",
    "any_gtex_brain": "Any GTEx brain tissue (13)",
    "metabrain": "MetaBrain cortex-EUR (meta)",
    "any_brain": "Any brain dataset (14)",
}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--per-locus", required=True)
    ap.add_argument("--summary", required=True)
    ap.add_argument("--out-prefix", required=True)
    args = ap.parse_args()

    with open(args.summary) as f:
        summary = json.load(f)
    per = pd.read_csv(args.per_locus, sep="\t")
    thr = summary["pp4_threshold"]
    n = summary["n_loci_analysed"]

    fig, (ax_a, ax_b) = plt.subplots(
        1, 2, figsize=(11.5, 4.6), facecolor=SURFACE,
        gridspec_kw={"width_ratios": [1.25, 1.0], "wspace": 0.32})

    # ------------------------------------------------------------- Panel A
    order = ["gtex_cortex", "any_gtex_brain", "metabrain", "any_brain"]
    fr = summary["fractions"]
    ys = range(len(order))[::-1]
    ax_a.set_facecolor(SURFACE)
    ax_a.xaxis.grid(True, color=GRID, linewidth=0.8, zorder=0)
    ax_a.set_axisbelow(True)
    for y, key in zip(ys, order):
        d = fr[key]
        ax_a.barh(y, d["fraction"], height=0.55, color=BLUE, zorder=3)
        ax_a.plot([d["wilson95_lo"], d["wilson95_hi"]], [y, y],
                  color=INK, linewidth=1.2, zorder=4)
        ax_a.text(max(d["wilson95_hi"], d["fraction"]) + 0.015, y,
                  f'{d["fraction"]:.0%}  ({d["n_colocalized"]}/{d["n_analysed"]})',
                  va="center", ha="left", fontsize=9, color=INK)
    ax_a.set_yticks(list(ys))
    ax_a.set_yticklabels([CLASS_LABELS[k] for k in order], fontsize=9.5,
                         color=INK)
    ax_a.set_xlim(0, 1.0)
    ax_a.set_xticks([0, 0.2, 0.4, 0.6, 0.8, 1.0])
    ax_a.set_xticklabels(["0%", "20%", "40%", "60%", "80%", "100%"],
                         fontsize=8.5, color=MUTED)
    ax_a.set_xlabel(f"Loci with best PP4 > {thr:g}", fontsize=9.5, color=INK2)
    ax_a.set_title(
        f"A   Colocalization rate across {n} analysable SCZ loci",
        loc="left", fontsize=11, color=INK, pad=12)
    for spine in ["top", "right", "left"]:
        ax_a.spines[spine].set_visible(False)
    ax_a.spines["bottom"].set_color(BASELINE)
    ax_a.tick_params(colors=MUTED, length=0)

    # ------------------------------------------------------------- Panel B
    sub = per[per["analysed"]].copy()
    x = sub["best_pp4_gtex_cortex"].fillna(0)
    y = sub["best_pp4_metabrain"].fillna(0)
    ax_b.set_facecolor(SURFACE)
    ax_b.grid(True, color=GRID, linewidth=0.8, zorder=0)
    ax_b.set_axisbelow(True)
    ax_b.axvline(thr, color=MUTED, linewidth=0.9, linestyle=(0, (4, 3)), zorder=1)
    ax_b.axhline(thr, color=MUTED, linewidth=0.9, linestyle=(0, (4, 3)), zorder=1)
    ax_b.scatter(x, y, s=22, color=BLUE, alpha=0.55, linewidths=0, zorder=3)

    both = int(((x > thr) & (y > thr)).sum())
    gtex_only = int(((x > thr) & (y <= thr)).sum())
    mb_only = int(((x <= thr) & (y > thr)).sum())
    neither = int(((x <= thr) & (y <= thr)).sum())
    for qx, qy, txt, ha, va in [
        (0.97, 0.97, f"both: {both}", "right", "top"),
        (0.97, 0.03, f"GTEx only: {gtex_only}", "right", "bottom"),
        (0.03, 0.97, f"MetaBrain only: {mb_only}", "left", "top"),
        (0.03, 0.03, f"neither: {neither}", "left", "bottom"),
    ]:
        ax_b.text(qx, qy, txt, transform=ax_b.transAxes, fontsize=8.5,
                  color=INK2, ha=ha, va=va)
    ax_b.set_xlim(-0.02, 1.02)
    ax_b.set_ylim(-0.02, 1.02)
    ax_b.set_xticks([0, 0.2, 0.4, 0.6, 0.8, 1.0])
    ax_b.set_yticks([0, 0.2, 0.4, 0.6, 0.8, 1.0])
    ax_b.tick_params(labelsize=8.5, colors=MUTED, length=0)
    ax_b.set_xlabel("Best PP4 — GTEx cortex", fontsize=9.5, color=INK2)
    ax_b.set_ylabel("Best PP4 — MetaBrain cortex-EUR", fontsize=9.5, color=INK2)
    ax_b.set_title("B   Per-locus agreement between cortex datasets",
                   loc="left", fontsize=11, color=INK, pad=12)
    for spine in ["top", "right"]:
        ax_b.spines[spine].set_visible(False)
    for spine in ["bottom", "left"]:
        ax_b.spines[spine].set_color(BASELINE)

    fig.suptitle("")
    fig.savefig(f"{args.out_prefix}.png", dpi=200, bbox_inches="tight",
                facecolor=SURFACE)
    fig.savefig(f"{args.out_prefix}.pdf", bbox_inches="tight",
                facecolor=SURFACE)
    print(f"wrote {args.out_prefix}.png/.pdf")


if __name__ == "__main__":
    main()
