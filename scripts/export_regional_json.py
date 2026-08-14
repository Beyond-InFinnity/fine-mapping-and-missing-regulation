"""Export one locus's regional-plot data as JSON for the web app.

Same track loaders and LD logic as fig_regional.py; output is a compact
JSON with per-point [pos, -log10(p), ldBin] triples. ldBin: 5 lead,
4 r2>=0.8, 3 >=0.6, 2 >=0.4, 1 >=0.2, 0 <0.2, -1 absent from panel.
Points with -log10(p) < 1 are thinned 2:1 to bound payload size.
"""
import argparse
import importlib.util
import json
import subprocess
import tempfile

import pandas as pd

spec = importlib.util.spec_from_file_location(
    "figreg", __file__.replace("export_regional_json.py", "fig_regional.py"))
figreg = importlib.util.module_from_spec(spec)
spec.loader.exec_module(figreg)


def bin_of(r2v):
    if r2v is None:
        return -1
    for thr, b in [(0.8, 4), (0.6, 3), (0.4, 2), (0.2, 1)]:
        if r2v >= thr:
            return b
    return 0


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--gwas-region", required=True)
    ap.add_argument("--track", action="append", required=True)
    ap.add_argument("--bfile", required=True)
    ap.add_argument("--genes", required=True)
    ap.add_argument("--chrom", required=True)
    ap.add_argument("--title", required=True)
    ap.add_argument("--lead-rsid", default=None)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    gwas = pd.read_csv(args.gwas_region, sep="\t")
    gwas["key"] = [figreg.variant_key(c, p, a, b) for c, p, a, b in
                   zip(gwas["CHR"], gwas["POS"], gwas["A1"], gwas["A2"])]

    with tempfile.TemporaryDirectory() as tmpdir:
        r2, lead_key = figreg.ld_lookup(gwas, args.bfile, tmpdir,
                                        args.lead_rsid)

    tracks_out = []
    xmin, xmax = None, None
    for spec_str in args.track:
        label, df = figreg.load_track(spec_str, gwas)
        pts = []
        low = 0
        for x, logp, key in zip(df["x"], df["logp"], df["key"]):
            if logp < 1:
                low += 1
                if low % 2:
                    continue
            b = 5 if key == lead_key else bin_of(r2.get(key))
            pts.append([int(x), round(float(logp), 2), b])
        tracks_out.append({"label": label, "pts": pts})
        xmin = min(xmin or 1e12, df["x"].min())
        xmax = max(xmax or 0, df["x"].max())

    genes = pd.read_csv(args.genes, sep="\t", header=None,
                        names=["chrom", "start", "end", "strand",
                               "gene_id", "gene_name", "gene_type"])
    genes = genes[(genes["chrom"] == args.chrom)
                  & (genes["gene_type"] == "protein_coding")
                  & (genes["end"] > xmin) & (genes["start"] < xmax)]
    gene_list = [{"n": g["gene_name"], "s": int(g["start"]), "e": int(g["end"])}
                 for _, g in genes.iterrows()]

    lead_pos = int(gwas.loc[gwas["key"] == lead_key, "POS"].iloc[0])
    out = {"title": args.title, "chrom": args.chrom, "leadPos": lead_pos,
           "leadKey": lead_key, "tracks": tracks_out, "genes": gene_list}
    with open(args.out, "w") as f:
        json.dump(out, f, separators=(",", ":"))
    print(f"{args.out}: {sum(len(t['pts']) for t in tracks_out)} points, "
          f"{len(gene_list)} genes")


if __name__ == "__main__":
    main()
