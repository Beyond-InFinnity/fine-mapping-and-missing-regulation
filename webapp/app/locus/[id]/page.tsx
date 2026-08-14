import Link from "next/link";
import { notFound } from "next/navigation";
import { CHANNELS, attrMeta } from "@/lib/channels";
import { fmtP, fmtPos, loci, locusById, nominationsByLocus } from "@/lib/data";

export function generateStaticParams() {
  return loci.map((l) => ({ id: l.id }));
}

export default async function LocusPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const l = locusById.get(id);
  if (!l) notFound();
  const noms = nominationsByLocus.get(id) ?? [];
  const meta = attrMeta(l.attribution);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="text-xs text-zinc-500 hover:underline">
          ← all loci
        </Link>
        <div className="mt-1 flex flex-wrap items-baseline gap-3">
          <h1 className="text-xl font-semibold">{l.id}</h1>
          <span
            className="rounded-full px-2.5 py-0.5 text-xs text-white"
            style={{ background: meta.color }}
          >
            {meta.label}
          </span>
        </div>
        <p className="mt-1 text-sm text-zinc-500">
          {fmtPos(l.chrom, l.pos)} · index{" "}
          <a
            className="text-blue-700 hover:underline dark:text-blue-400"
            href={`https://www.ncbi.nlm.nih.gov/snp/${l.indexSnp}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {l.indexSnp}
          </a>{" "}
          · GWAS p = {fmtP(l.topP)}
        </p>
      </div>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-3 text-sm font-semibold">
            Colocalization evidence (best PP4 per channel)
          </h2>
          <div className="space-y-2">
            {CHANNELS.map((c) => {
              const v = l.channels[c.key];
              return (
                <div key={c.key} className="flex items-center gap-2 text-xs">
                  <span className="w-28 shrink-0 text-zinc-500">
                    {c.label}
                  </span>
                  <div className="relative h-3 flex-1 rounded bg-zinc-100 dark:bg-zinc-800">
                    {v !== null && (
                      <div
                        className="h-3 rounded"
                        style={{
                          width: `${Math.max(1.5, v * 100)}%`,
                          background: c.color,
                          opacity: v >= 0.8 ? 1 : 0.45,
                        }}
                      />
                    )}
                    <div className="absolute inset-y-0 left-[80%] w-px bg-zinc-400/70" />
                  </div>
                  <span className="w-10 text-right tabular-nums">
                    {v === null ? "–" : v.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] text-zinc-400">
            Vertical line marks the PP4 = 0.8 threshold.
          </p>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-3 text-sm font-semibold">Fine-mapping and annotation</h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <dt className="text-zinc-500">GWAS credible sets (SuSiE)</dt>
            <dd className="tabular-nums">{l.nGwasCs ?? "–"}</dd>
            <dt className="text-zinc-500">CS mass in fetal regulatory chromatin</dt>
            <dd className="tabular-nums">{l.fetalRegPip ?? "–"}</dd>
            <dt className="text-zinc-500">CS mass in adult regulatory chromatin</dt>
            <dd className="tabular-nums">{l.adultRegPip ?? "–"}</dd>
            <dt className="text-zinc-500">Best bulk-eQTL gene</dt>
            <dd className="italic">{l.bestBulkGene ?? "–"}</dd>
            <dt className="text-zinc-500">Best single-cell type</dt>
            <dd>{l.bestScCt?.replaceAll("_", " ") ?? "–"}</dd>
            <dt className="text-zinc-500">External</dt>
            <dd>
              <a
                className="text-blue-700 hover:underline dark:text-blue-400"
                href={`https://genome.ucsc.edu/cgi-bin/hgTracks?db=hg38&position=chr${l.chrom}%3A${l.pos - 500000}-${l.pos + 500000}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                UCSC browser ↗
              </a>
            </dd>
          </dl>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold">
          Gene nominations via methylation chain ({noms.length})
        </h2>
        {noms.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No chained nominations at this locus (requires a GWAS-colocalizing
            CpG plus a CpG-gene expression link).
          </p>
        ) : (
          <div className="overflow-auto rounded border border-zinc-200 dark:border-zinc-800">
            <table className="w-full min-w-[560px] text-xs">
              <thead className="bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                <tr>
                  <th className="px-2 py-1.5 text-left font-medium">Gene</th>
                  <th className="px-2 py-1.5 text-left font-medium">Tier</th>
                  <th className="px-2 py-1.5 text-left font-medium">Chain score</th>
                  <th className="px-2 py-1.5 text-left font-medium">CpG</th>
                  <th className="px-2 py-1.5 text-left font-medium">CpG–TSS dist</th>
                  <th className="px-2 py-1.5 text-left font-medium">Direct eQTL PP4</th>
                </tr>
              </thead>
              <tbody>
                {noms.map((n) => (
                  <tr
                    key={`${n.gene}-${n.cpg}`}
                    className="border-t border-zinc-100 dark:border-zinc-800/60"
                  >
                    <td className="px-2 py-1 italic">
                      <a
                        className="text-blue-700 hover:underline dark:text-blue-400"
                        href={`https://platform.opentargets.org/target/${n.gene}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {n.symbol ?? n.gene}
                      </a>
                    </td>
                    <td className="px-2 py-1">{n.tier}</td>
                    <td className="px-2 py-1 tabular-nums">
                      {n.score.toFixed(2)}
                    </td>
                    <td className="px-2 py-1">{n.cpg}</td>
                    <td className="px-2 py-1 tabular-nums">
                      {n.tssDist === null
                        ? "–"
                        : `${(n.tssDist / 1000).toFixed(0)} kb`}
                    </td>
                    <td className="px-2 py-1 tabular-nums">
                      {n.directPp4?.toFixed(2) ?? "–"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
