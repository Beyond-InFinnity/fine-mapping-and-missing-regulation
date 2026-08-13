"""Ledger waterfall: sequential attribution of the 281 loci across
explanation channels, ending at the unexplained residue."""
import argparse
import json

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

SURFACE = "#ffffff"
INK = "#0b0b0b"
INK2 = "#52514e"
GRID = "#e1e0d9"
CHANNEL_COLORS = {
    "bulk_expression": "#2a78d6",
    "susie_rescue": "#5598e7",
    "single_cell": "#1baf7a",
    "fetal_eqtl": "#eda100",
    "splicing": "#eb6834",
    "methylation": "#7b2d8b",
    "unexplained": "#b8b8b8",
}
LABELS = {
    "bulk_expression": "Bulk expression\n(14 datasets)",
    "susie_rescue": "Multi-signal\nrescue",
    "single_cell": "Single-cell\neQTL",
    "fetal_eqtl": "Fetal\neQTL",
    "splicing": "Splicing\n(17 datasets)",
    "methylation": "Methylation\n(Brain-mMeta)",
    "unexplained": "Unexplained",
}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--ledger", required=True)
    ap.add_argument("--out-prefix", required=True)
    args = ap.parse_args()

    with open(args.ledger) as f:
        led = json.load(f)
    steps = [(e["channel"], e["newly_explained"])
             for e in led["sequential_ledger"]]
    steps.append(("unexplained", led["n_unexplained_final"]))
    n_total = led["n_analysed"]

    fig, ax = plt.subplots(figsize=(6.5, 3.4), dpi=300, facecolor=SURFACE,
                           constrained_layout=True)
    ax.set_facecolor(SURFACE)
    ax.yaxis.grid(True, color=GRID, linewidth=0.7, zorder=0)
    ax.set_axisbelow(True)

    base = 0
    for i, (ch, n) in enumerate(steps):
        color = CHANNEL_COLORS[ch]
        bottom = 0 if ch == "unexplained" else base
        height = n_total - base if ch == "unexplained" else n
        if ch == "unexplained":
            bottom, height = base, n
        ax.bar(i, height, bottom=bottom, width=0.62, color=color, zorder=3)
        ax.text(i, bottom + height + 4, str(n), ha="center", fontsize=7.5,
                color=INK)
        if ch != "unexplained":
            base += n
            if i < len(steps) - 1:
                ax.plot([i + 0.31, i + 1 - 0.31], [base, base],
                        color=INK2, linewidth=0.7, linestyle=(0, (2, 2)),
                        zorder=2)

    ax.axhline(n_total, color=INK2, linewidth=0.7, linestyle=(0, (4, 3)))
    ax.text(0.02, n_total - 14, f"all {n_total} loci",
            fontsize=6.5, color=INK2, ha="left")
    ax.set_xticks(range(len(steps)))
    ax.set_xticklabels([LABELS[ch] for ch, _ in steps], fontsize=6.5)
    ax.set_ylabel("Loci (cumulative attribution)", fontsize=7.5)
    ax.tick_params(labelsize=6.5, length=0)
    for sp in ["top", "right"]:
        ax.spines[sp].set_visible(False)
    ax.set_title("Sequential attribution of 281 schizophrenia loci "
                 "across molecular channels (PP4 > 0.8)",
                 fontsize=8.5, loc="left")

    fig.savefig(f"{args.out_prefix}.pdf")
    fig.savefig(f"{args.out_prefix}.png", dpi=300)
    print(f"wrote {args.out_prefix}.pdf/.png")


if __name__ == "__main__":
    main()
