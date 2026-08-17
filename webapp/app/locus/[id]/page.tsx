import Link from "next/link";
import { notFound } from "next/navigation";
import Explainer, { ExplainerSection } from "@/components/Explainer";
import Term from "@/components/Term";
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
          <Explainer title="How to read these bars">
            <ExplainerSection label="What this data is">
              The strongest <Term k="colocalization">colocalization</Term>{" "}
              between this locus&rsquo;s GWAS signal and each evidence
              channel, taking the best <Term k="pp4">PP4</Term> across every
              dataset in the channel.
            </ExplainerSection>
            <ExplainerSection label="How to read it">
              Bars fill toward 1. Solid bars pass the 0.8 threshold used
              sitewide; faded bars fall short; a dash means no dataset in the
              channel yielded a valid test here, usually because too few
              variants were shared between the studies. Treat a passing bar
              as evidence that the GWAS signal and that molecular trait
              plausibly share one causal variant, not as proof that the trait
              causes the disease.
            </ExplainerSection>
          </Explainer>
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
          <Explainer title="What these annotations mean">
            <ExplainerSection label="Reading guide">
              <Term k="credible-set">Credible sets</Term> come from{" "}
              <Term k="susie">SuSiE</Term> fine-mapping of the GWAS: each is
              the smallest set of variants 95% likely to contain the causal
              variant for one independent signal, so a count above one means
              this locus carries multiple signals. The two chromatin numbers
              give the fraction of credible-set probability falling in{" "}
              <Term k="regulatory-chromatin">regulatory chromatin</Term>{" "}
              (enhancer or promoter states) of fetal versus adult brain; a
              high fetal value beside a low adult one hints at a
              developmental window. The best bulk gene and best single-cell
              type are the strongest direct expression matches, listed even
              when they fall below threshold.
            </ExplainerSection>
          </Explainer>
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
        <Explainer title="How to read these nominations">
          <ExplainerSection label="Reading guide">
            Each row is a{" "}
            <Term k="methylation-chain">methylation chain</Term>: the GWAS
            signal colocalizes with a CpG&rsquo;s methylation signal, and the
            same methylation signal colocalizes with this gene&rsquo;s
            expression in independent data. The chain score is the weaker of
            the two links, and the <Term k="tier">tier</Term> bands it (high
            means at least 0.8). CpG-to-<Term k="tss">TSS</Term> distance is
            a plausibility check, since regulatory contacts weaken with
            distance, and the direct eQTL PP4 column shows what direct
            expression testing said at this locus. Nominations are ranked
            hypotheses for follow-up, not confirmed target genes.
          </ExplainerSection>
        </Explainer>
      </section>
    </div>
  );
}
