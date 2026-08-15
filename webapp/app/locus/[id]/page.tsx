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
        <Link href="/" className="text-xs text-[var(--muted)] hover:text-[var(--gold)]">
          ← all loci
        </Link>
        <div className="mt-1 flex flex-wrap items-baseline gap-3">
          <h1 className="font-display text-3xl">{l.id}</h1>
          <span
            className="rounded-full px-2.5 py-0.5 text-xs text-white"
            style={{ background: meta.color }}
          >
            {meta.label}
          </span>
        </div>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {fmtPos(l.chrom, l.pos)} · index{" "}
          <a
            className="lnk"
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
        <div className="panel p-5">
          <h2 className="kicker mb-3 !text-[var(--gold)]">
            Colocalization evidence (best PP4 per channel)
          </h2>
          <div className="space-y-2">
            {CHANNELS.map((c) => {
              const v = l.channels[c.key];
              return (
                <div key={c.key} className="flex items-center gap-2 text-xs">
                  <span className="w-28 shrink-0 text-[var(--muted)]">
                    {c.label}
                  </span>
                  <div className="relative h-3 flex-1 rounded bg-[var(--panel-2)]">
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
                    <div className="absolute inset-y-0 left-[80%] w-px bg-[var(--rose)]" />
                  </div>
                  <span className="w-10 text-right tabular-nums">
                    {v === null ? "–" : v.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] text-[var(--muted)]">
            Vertical line marks the PP4 = 0.8 threshold.
          </p>
        </div>

        <div className="panel p-5 text-sm">
          <h2 className="kicker mb-3 !text-[var(--gold)]">Fine-mapping and annotation</h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <dt className="text-[var(--muted)]">GWAS credible sets (SuSiE)</dt>
            <dd className="tabular-nums">{l.nGwasCs ?? "–"}</dd>
            <dt className="text-[var(--muted)]">CS mass in fetal regulatory chromatin</dt>
            <dd className="tabular-nums">{l.fetalRegPip ?? "–"}</dd>
            <dt className="text-[var(--muted)]">CS mass in adult regulatory chromatin</dt>
            <dd className="tabular-nums">{l.adultRegPip ?? "–"}</dd>
            <dt className="text-[var(--muted)]">Best bulk-eQTL gene</dt>
            <dd className="italic">{l.bestBulkGene ?? "–"}</dd>
            <dt className="text-[var(--muted)]">Best single-cell type</dt>
            <dd>{l.bestScCt?.replaceAll("_", " ") ?? "–"}</dd>
            <dt className="text-[var(--muted)]">External</dt>
            <dd>
              <a
                className="lnk"
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
        <h2 className="kicker mb-3 !text-[var(--gold)]">
          Gene nominations via methylation chain ({noms.length})
        </h2>
        {noms.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            No chained nominations at this locus (requires a GWAS-colocalizing
            CpG plus a CpG-gene expression link).
          </p>
        ) : (
          <div className="panel overflow-auto !rounded-md">
            <table className="table-dark w-full min-w-[560px] text-xs">
              <thead className="">
                <tr>
                  <th className="px-2 py-2 text-left">Gene</th>
                  <th className="px-2 py-2 text-left">Tier</th>
                  <th className="px-2 py-2 text-left">Chain score</th>
                  <th className="px-2 py-2 text-left">CpG</th>
                  <th className="px-2 py-2 text-left">CpG–TSS dist</th>
                  <th className="px-2 py-2 text-left">Direct eQTL PP4</th>
                </tr>
              </thead>
              <tbody>
                {noms.map((n) => (
                  <tr
                    key={`${n.gene}-${n.cpg}`}
                    className=""
                  >
                    <td className="px-2 py-1 italic">
                      <a
                        className="lnk"
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
