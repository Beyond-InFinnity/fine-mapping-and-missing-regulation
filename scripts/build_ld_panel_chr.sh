#!/usr/bin/env bash
# Build one chromosome of the EUR LD reference panel:
# 1000G GRCh38 high-coverage phased VCF -> EUR unrelated (n=503),
# biallelic SNPs, MAF floor -> plink1 bed/bim/fam with IDs "chr:pos:ref:alt"
# (numeric chromosome names to match the GWAS convention).
set -euo pipefail

VCF="$1"          # input phased VCF (chr-prefixed names)
EUR_IDS="$2"      # one sample ID per line (503)
MIN_MAF="$3"
OUT_PREFIX="$4"   # plink output prefix
TMPDIR="$5"

mkdir -p "$TMPDIR" "$(dirname "$OUT_PREFIX")"
TMPVCF="$TMPDIR/$(basename "$OUT_PREFIX").eur.vcf.gz"
trap 'rm -f "$TMPVCF"' EXIT

N_EXPECTED=$(wc -l < "$EUR_IDS")

bcftools view -S "$EUR_IDS" -m2 -M2 -v snps -q "${MIN_MAF}:minor" \
    --threads 2 -Oz -o "$TMPVCF" "$VCF"

N_GOT=$(bcftools query -l "$TMPVCF" | wc -l)
if [ "$N_GOT" -ne "$N_EXPECTED" ]; then
    echo "FATAL: EUR subset has $N_GOT samples, expected $N_EXPECTED" >&2
    exit 1
fi

plink2 --vcf "$TMPVCF" \
    --set-all-var-ids '@:#:$r:$a' \
    --output-chr 26 \
    --make-bed \
    --out "$OUT_PREFIX"

# fail if the panel came out implausibly small
N_VAR=$(wc -l < "${OUT_PREFIX}.bim")
if [ "$N_VAR" -lt 10000 ]; then
    echo "FATAL: only $N_VAR variants in LD panel ${OUT_PREFIX}" >&2
    exit 1
fi
echo "LD panel ${OUT_PREFIX}: ${N_VAR} variants, ${N_GOT} samples"
