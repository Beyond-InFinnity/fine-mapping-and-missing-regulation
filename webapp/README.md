# Missing Regulation Explorer (web app)

Next.js + Tailwind showcase for the schizophrenia missing-regulation
analysis. Fully static export: no server, no database. All data is baked
in at build time from the pipeline's results tables.

## Develop

```bash
cd webapp
npm install
npm run dev        # http://localhost:3000
```

## Build (static export)

```bash
npm run build      # emits webapp/out/ (288 static pages)
```

## Refresh the data

From the repository root, after a pipeline run:

```bash
python scripts/export_webapp_data.py \
  --ledger-table results/final/ledger_per_locus.tsv \
  --ledger-json results/final/ledger.json \
  --per-locus-stage1 results/stage1/per_locus_table.tsv \
  --explanations results/stage2/explanations.tsv \
  --loci data/derived/loci_hg38.tsv \
  --nominations results/final/gene_nominations.tsv \
  --stage1-summary results/stage1/summary.json \
  --stage2-summary results/stage2/stage2_summary.json \
  --outdir webapp/data
snakemake -s workflow/Snakefile results/webdata/regional.done
cp results/webdata/regional_*.json webapp/public/data/
```

## Deploy to a subdomain of nerv-analytic.ai

The export is plain static files; any of these work.

**Vercel (simplest):** import the GitHub repo, set the project root to
`webapp/`; Vercel detects Next.js and honors the static export. Add the
custom domain (for example `scz.nerv-analytic.ai`) in the Vercel project
settings, then create a CNAME record for `scz` pointing at
`cname.vercel-dns.com`.

**Cloudflare Pages:** same idea; root `webapp/`, build command
`npm run build`, output directory `out`.

**Own server (nginx):** copy `webapp/out/` to the server, e.g.
`rsync -a webapp/out/ server:/var/www/scz.nerv-analytic.ai/`, add an
A/AAAA or CNAME record for the subdomain, and serve:

```nginx
server {
    server_name scz.nerv-analytic.ai;
    root /var/www/scz.nerv-analytic.ai;
    index index.html;
    location / { try_files $uri $uri/index.html =404; }
}
```

The app assumes it is served from the domain root. To serve under a path
prefix instead, set `basePath` in `next.config.ts` and rebuild.
