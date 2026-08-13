"""Regional association plot: stacked -log10(p) tracks for one locus,
LD-colored against the GWAS lead variant using the project 1000G EUR
panel, with a protein-coding gene track below.

Track spec (repeatable --track): LABEL:TYPE:PATH[:TRAIT]
  TYPE gwas     : harmonized GWAS region file (header CHR..PVAL)
  TYPE eqtlcat  : eQTL Catalogue region (19 headerless cols); TRAIT = gene id
  TYPE metabrain: MetaBrain region extract; TRAIT = ENSG (version-stripped)
  TYPE meqtl    : SMR query region (hg19); TRAIT = CpG probe. Positions are
                  remapped to GWAS hg38 coordinates through shared rsIDs.

All panels share the GWAS hg38 x-axis. Conventional LocusZoom LD bins;
the lead variant is drawn as a purple diamond in every track.
"""
import argparse
import subprocess
import tempfile

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

LD_BINS = [(0.8, "#d43f3a"), (0.6, "#eea236"), (0.4, "#5cb85c"),
           (0.2, "#46b8da"), (-0.01, "#2c3e50")]
LEAD_COLOR = "#7b2d8b"
EQTLCAT_COLS = ["molecular_trait_id", "chromosome", "position", "ref", "alt",
                "variant", "ma_samples", "maf", "pvalue", "beta", "se",
                "type", "ac", "an", "r2", "molecular_trait_object_id",
                "gene_id", "median_tpm", "rsid"]


def variant_key(chrom, pos, a1, a2):
    a1, a2 = str(a1).upper(), str(a2).upper()
    return f"{chrom}:{pos}:{min(a1, a2)}:{max(a1, a2)}"


def load_track(spec, gwas):
    parts = spec.split(":")
    label, ttype, path = parts[0], parts[1], parts[2]
    trait = parts[3] if len(parts) > 3 else None
    if ttype == "gwas":
        df = gwas.copy()
        df["p"] = df["PVAL"]
        df["x"] = df["POS"]
    elif ttype == "eqtlcat":
        raw = pd.read_csv(path, sep="\t", header=None, names=EQTLCAT_COLS)
        raw = raw[raw["molecular_trait_id"] == trait]
        assert len(raw) > 0, f"trait {trait} absent in {path}"
        raw["key"] = [variant_key(c, p, r, a) for c, p, r, a in
                      zip(raw["chromosome"], raw["position"],
                          raw["ref"], raw["alt"])]
        df = raw.rename(columns={"pvalue": "p", "position": "x"})
    elif ttype == "metabrain":
        raw = pd.read_csv(path, sep="\t")
        raw["gene"] = raw["ProbeName"].str.replace(r"\..*$", "", regex=True)
        raw = raw[raw["gene"] == trait]
        assert len(raw) > 0, f"trait {trait} absent in {path}"
        raw["key"] = [variant_key(c, p, r, a) for c, p, r, a in
                      zip(raw["SNPChr"], raw["SNPChrPos"],
                          raw["RefAllele"], raw["AltAllele"])]
        df = raw.rename(columns={"PValue": "p", "SNPChrPos": "x"})
    elif ttype == "meqtl":
        raw = pd.read_csv(path, sep="\t")
        raw = raw[raw["Probe"] == trait]
        assert len(raw) > 0, f"trait {trait} absent in {path}"
        rs_to = gwas.set_index("ID")[["POS", "key"]]
        raw = raw.join(rs_to, on="SNP", how="inner")
        df = raw.rename(columns={"p": "p", "POS": "x"})
    else:
        raise ValueError(ttype)
    df = df[np.isfinite(df["p"]) & (df["p"] > 0)]
    df["logp"] = -np.log10(df["p"].clip(lower=1e-300))
    return label, df[["x", "logp", "key"]]


def ld_lookup(gwas, bfile, tmpdir, lead_rsid=None):
    """r2 of every panel variant against the GWAS lead, keyed like GWAS."""
    if lead_rsid is not None:
        sub = gwas[gwas["ID"] == lead_rsid]
        assert len(sub) == 1, f"lead rsid {lead_rsid} not unique in region"
        lead = sub.iloc[0]
    else:
        lead = gwas.loc[gwas["PVAL"].idxmin()]
    bim = pd.read_csv(f"{bfile}.bim", sep="\t", header=None,
                      names=["chr", "id", "cm", "pos", "a1", "a2"])
    bim["key"] = [variant_key(c, p, a, b) for c, p, a, b in
                  zip(bim["chr"], bim["pos"], bim["a1"], bim["a2"])]
    hit = bim[bim["key"] == lead["key"]]
    assert len(hit) == 1, f"lead {lead['key']} not unique in panel"
    lead_id = hit["id"].iloc[0]
    out = f"{tmpdir}/ld"
    subprocess.run(
        ["plink", "--bfile", bfile, "--ld-snp", lead_id, "--r2",
         "--ld-window-kb", "2000", "--ld-window", "99999",
         "--ld-window-r2", "0", "--memory", "3000", "--threads", "2",
         "--out", out], check=True, capture_output=True)
    ld = pd.read_csv(f"{out}.ld", sep=r"\s+")
    id_to_key = bim.set_index("id")["key"]
    ld["key"] = ld["SNP_B"].map(id_to_key)
    return ld.set_index("key")["R2"].to_dict(), lead["key"]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--gwas-region", required=True)
    ap.add_argument("--track", action="append", required=True)
    ap.add_argument("--bfile", required=True)
    ap.add_argument("--genes", required=True, help="gencode hg38 gene table")
    ap.add_argument("--chrom", required=True)
    ap.add_argument("--title", required=True)
    ap.add_argument("--lead-rsid", default=None,
                    help="color LD to this variant instead of the min-p variant")
    ap.add_argument("--out-prefix", required=True)
    args = ap.parse_args()

    gwas = pd.read_csv(args.gwas_region, sep="\t")
    gwas["key"] = [variant_key(c, p, a, b) for c, p, a, b in
                   zip(gwas["CHR"], gwas["POS"], gwas["A1"], gwas["A2"])]

    with tempfile.TemporaryDirectory() as tmpdir:
        r2, lead_key = ld_lookup(gwas, args.bfile, tmpdir, args.lead_rsid)

    tracks = [load_track(s, gwas) for s in args.track]
    xmin = min(t["x"].min() for _, t in tracks)
    xmax = max(t["x"].max() for _, t in tracks)

    genes = pd.read_csv(args.genes, sep="\t", header=None,
                        names=["chrom", "start", "end", "strand",
                               "gene_id", "gene_name", "gene_type"])
    genes = genes[(genes["chrom"] == args.chrom)
                  & (genes["gene_type"] == "protein_coding")
                  & (genes["end"] > xmin) & (genes["start"] < xmax)]

    n = len(tracks)
    fig, axes = plt.subplots(
        n + 1, 1, figsize=(6.5, 1.7 * n + 1.1), sharex=True, dpi=300,
        gridspec_kw={"height_ratios": [1.0] * n + [0.55]},
        constrained_layout=True)
    axes = np.atleast_1d(axes)

    for ax, (label, df) in zip(axes[:n], tracks):
        colors = []
        for k in df["key"]:
            v = r2.get(k, np.nan)
            if np.isnan(v):
                colors.append("#b8b8b8")
                continue
            for thr, col in LD_BINS:
                if v >= thr:
                    colors.append(col)
                    break
        ax.scatter(df["x"] / 1e6, df["logp"], s=7, c=colors,
                   linewidths=0, zorder=3, rasterized=True)
        lead_row = df[df["key"] == lead_key]
        if len(lead_row):
            ax.scatter(lead_row["x"] / 1e6, lead_row["logp"], s=42,
                       marker="D", c=LEAD_COLOR, zorder=4,
                       edgecolors="white", linewidths=0.5)
        ax.set_ylabel(r"$-\log_{10}(p)$", fontsize=7)
        ax.text(0.005, 0.94, label, transform=ax.transAxes, fontsize=7.5,
                va="top", fontweight="bold")
        ax.tick_params(labelsize=6.5)
        for sp in ["top", "right"]:
            ax.spines[sp].set_visible(False)

    axg = axes[n]
    rows = {}
    for _, g in genes.sort_values("start").iterrows():
        row = 0
        while any(g["start"] / 1e6 < end + 0.02
                  for s, end in rows.get(row, [])):
            row += 1
        rows.setdefault(row, []).append((g["start"] / 1e6, g["end"] / 1e6))
        y = -row
        axg.plot([g["start"] / 1e6, g["end"] / 1e6], [y, y],
                 color="#2c3e50", linewidth=2.4, solid_capstyle="butt")
        axg.text((g["start"] + g["end"]) / 2e6, y + 0.28, g["gene_name"],
                 fontsize=5.2, ha="center", style="italic")
    axg.set_ylim(-(max(rows) if rows else 0) - 0.7, 0.9)
    axg.set_yticks([])
    axg.set_xlabel(f"Chromosome {args.chrom} position (Mb, GRCh38)",
                   fontsize=7.5)
    axg.tick_params(labelsize=6.5)
    for sp in ["top", "right", "left"]:
        axg.spines[sp].set_visible(False)

    handles = [plt.Line2D([], [], marker="o", linestyle="", markersize=4.5,
                          color=c, label=l)
               for (t, c), l in zip(LD_BINS, [r"$r^2\geq0.8$", r"$\geq0.6$",
                                              r"$\geq0.4$", r"$\geq0.2$",
                                              r"$<0.2$"])]
    handles.append(plt.Line2D([], [], marker="D", linestyle="",
                              markersize=5, color=LEAD_COLOR, label="lead"))
    axes[0].legend(handles=handles, fontsize=5.5, frameon=False,
                   loc="upper right", ncol=2, title=r"LD to lead",
                   title_fontsize=5.5)
    axes[0].set_title(args.title, fontsize=8.5, loc="left")

    fig.savefig(f"{args.out_prefix}.pdf")
    fig.savefig(f"{args.out_prefix}.png", dpi=300)
    print(f"wrote {args.out_prefix}.pdf/.png")


if __name__ == "__main__":
    main()
