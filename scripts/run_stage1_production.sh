#!/usr/bin/env bash
# Launch the full Stage 1 run (all 281 analysable loci x 14 datasets).
# Intended for the workstation: nohup-safe, resumable (snakemake handles
# incomplete outputs), logs to logs/stage1_production_<timestamp>.log
set -euo pipefail
cd "$(dirname "$0")/.."

CORES="${1:-14}"
NET="${2:-8}"

mkdir -p logs
LOG="logs/stage1_production_$(date +%Y%m%dT%H%M%S).log"
echo "logging to $LOG"

snakemake -s workflow/Snakefile all \
    --cores "$CORES" \
    --resources net="$NET" \
    --keep-going \
    --rerun-incomplete \
    >> "$LOG" 2>&1

echo "stage 1 production run complete"
