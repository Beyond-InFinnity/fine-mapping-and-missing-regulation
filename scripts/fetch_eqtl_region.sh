#!/usr/bin/env bash
# Fetch one region from a remote tabix-indexed eQTL Catalogue file.
# Writes <out> (gzipped) plus a <out>.meta provenance sidecar.
# An empty region (0 rows) is a valid result and is recorded as such;
# transport failures are retried with backoff and ultimately fatal.
set -euo pipefail

URL="$1"        # https://.../QTDxxxxxx.all.tsv.gz (with .tbi alongside)
REGION="$2"     # chrom:start-end (chrom naming: 1..22)
OUT="$3"        # output path ending in .tsv.gz
RETRIES="${4:-3}"

RAW="${OUT%.tsv.gz}.tmp$$.tsv"   # plain-text temp in the same directory
trap 'rm -f "$RAW" "$RAW.gz" "$RAW.err"' EXIT

attempt=1
while true; do
    if tabix -D "$URL" "$REGION" > "$RAW" 2> "$RAW.err"; then
        break
    fi
    if [ "$attempt" -ge "$RETRIES" ]; then
        echo "FATAL: tabix failed after ${RETRIES} attempts: $URL $REGION" >&2
        cat "$RAW.err" >&2
        exit 1
    fi
    sleep $((attempt * 15))
    attempt=$((attempt + 1))
done

ROWS=$(wc -l < "$RAW")
gzip -f "$RAW"
mv "$RAW.gz" "$OUT"

cat > "${OUT}.meta" <<EOF
url	${URL}
region	${REGION}
rows	${ROWS}
fetched_utc	$(date -u +%Y-%m-%dT%H:%M:%SZ)
sha256	$(sha256sum "$OUT" | cut -d' ' -f1)
EOF
