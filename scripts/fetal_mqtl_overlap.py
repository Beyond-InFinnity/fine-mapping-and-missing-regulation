"""Overlap GWAS SuSiE credible-set variants with Hannon et al. fetal brain
mQTL SNPs (Bonferroni-significant release — the only public granularity,
so this is an OVERLAP/enrichment analysis, not colocalization; documented
as such in the report).

Hannon positions are hg19 without rsIDs; credible-set variants are mapped
rsID -> hg19 position through the harmonized hg19 GWAS (tabix region
lookup per locus), keeping every step position-explicit.
"""
import argparse
import csv
import gzip
import subprocess


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--hannon", required=True)
    ap.add_argument("--loci", required=True)
    ap.add_argument("--susie-dir", required=True)
    ap.add_argument("--gwas-hg19", required=True, help="bgzip+tabix, hg19")
    ap.add_argument("--window-bp", type=int, required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    fetal = set()
    with gzip.open(args.hannon, "rt") as f:
        r = csv.reader(f)
        header = next(r)
        assert header[1:3] == ["SNP_Chr", "SNP_BP"], header
        for row in r:
            fetal.add((row[1], int(row[2])))
    assert len(fetal) > 10000, f"implausibly few fetal mQTL SNPs: {len(fetal)}"

    with open(args.loci) as f:
        loci = [r for r in csv.DictReader(f, delimiter="\t")
                if r["status"] == "pass"]

    rows = []
    for loc in loci:
        locus_id = loc["locus_id"]
        chrom = loc["chrom"]
        pos19 = int(loc["index_pos_hg19"])
        region = f"{chrom}:{max(1, pos19 - args.window_bp)}-{pos19 + args.window_bp}"
        q = subprocess.run(f"tabix {args.gwas_hg19} {region}", shell=True,
                           check=True, capture_output=True, text=True)
        rs_to_pos = {}
        for line in q.stdout.splitlines():
            p = line.split("\t", 3)
            rs_to_pos[p[2]] = int(p[1])

        with open(f"{args.susie_dir}/{locus_id}.cs.tsv") as f:
            cs = list(csv.DictReader(f, delimiter="\t"))
        if not cs:
            rows.append({"locus_id": locus_id, "n_cs_variants": 0,
                         "n_mapped_hg19": 0, "n_in_fetal_mqtl": 0,
                         "pip_total": "", "pip_in_fetal_mqtl": "",
                         "any_fetal_mqtl": ""})
            continue

        n_mapped = n_hit = 0
        pip_tot = pip_hit = 0.0
        for v in cs:
            p19 = rs_to_pos.get(v["rsid"])
            pip = float(v["pip"])
            pip_tot += pip
            if p19 is None:
                continue
            n_mapped += 1
            if (chrom, p19) in fetal:
                n_hit += 1
                pip_hit += pip
        rows.append({"locus_id": locus_id, "n_cs_variants": len(cs),
                     "n_mapped_hg19": n_mapped, "n_in_fetal_mqtl": n_hit,
                     "pip_total": round(pip_tot, 4),
                     "pip_in_fetal_mqtl": round(pip_hit / pip_tot, 4),
                     "any_fetal_mqtl": int(n_hit > 0)})

    with open(args.out, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()), delimiter="\t")
        w.writeheader()
        w.writerows(rows)
    n_with = sum(1 for r in rows if r["any_fetal_mqtl"] == 1)
    print(f"{len(rows)} loci annotated; {n_with} have >=1 CS variant that is "
          f"a significant fetal brain mQTL")


if __name__ == "__main__":
    main()
