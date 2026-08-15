"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CHANNELS, attrMeta } from "@/lib/channels";
import type { Attribution, ChannelKey, Locus } from "@/lib/types";

type SortKey = "pos" | "topP" | ChannelKey;

function Pp4Cell({ v }: { v: number | null }) {
  if (v === null) return <td className="px-2 py-1.5 text-[var(--muted)]">–</td>;
  const strong = v >= 0.8;
  return (
    <td
      className={`px-2 py-1.5 tabular-nums ${
        strong
          ? "font-semibold text-[var(--gold-bright)]"
          : "text-[var(--ink-dim)]"
      }`}
    >
      {v.toFixed(2)}
    </td>
  );
}

export default function LocusTable({
  loci,
  filter,
}: {
  loci: Locus[];
  filter: Attribution | null;
}) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("topP");
  const [asc, setAsc] = useState(true);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let r = loci.filter(
      (l) =>
        (filter === null || l.attribution === filter) &&
        (needle === "" ||
          l.id.toLowerCase().includes(needle) ||
          l.indexSnp.toLowerCase().includes(needle) ||
          (l.topNomination?.gene ?? "").toLowerCase().includes(needle) ||
          (l.bestBulkGene ?? "").toLowerCase().includes(needle)),
    );
    r = [...r].sort((a, b) => {
      const va =
        sort === "pos"
          ? Number(a.chrom) * 1e9 + a.pos
          : sort === "topP"
            ? a.topP
            : (a.channels[sort] ?? -1);
      const vb =
        sort === "pos"
          ? Number(b.chrom) * 1e9 + b.pos
          : sort === "topP"
            ? b.topP
            : (b.channels[sort] ?? -1);
      return asc ? va - vb : vb - va;
    });
    return r;
  }, [loci, filter, q, sort, asc]);

  const th = (key: SortKey, label: string) => (
    <th
      key={key}
      className="cursor-pointer select-none px-2 py-2 text-left hover:text-[var(--gold)]"
      onClick={() => {
        if (sort === key) setAsc(!asc);
        else {
          setSort(key);
          setAsc(key === "pos" || key === "topP");
        }
      }}
    >
      {label}
      {sort === key ? (asc ? " ↑" : " ↓") : ""}
    </th>
  );

  return (
    <div>
      <div className="mb-3 flex items-center gap-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search locus, rsID, or gene…"
          className="w-72 rounded border border-[var(--line)] bg-[var(--panel)] px-3 py-1.5 text-sm font-light text-[var(--ink)] placeholder:text-[var(--muted)] focus:border-[var(--gold)] focus:outline-none"
        />
        <span className="text-xs font-light text-[var(--muted)]">
          {rows.length} of {loci.length} loci
          {filter ? ` · attribution: ${attrMeta(filter).label}` : ""}
        </span>
      </div>
      <div className="panel max-h-[520px] overflow-auto !rounded-md">
        <table className="table-dark w-full min-w-[780px] text-xs">
          <thead className="sticky top-0 z-10">
            <tr>
              <th className="px-2 py-2 text-left">Locus</th>
              {th("pos", "Position")}
              {th("topP", "GWAS p")}
              {CHANNELS.map((c) => th(c.key, c.label.split(" ")[0]))}
              <th className="px-2 py-2 text-left">Attribution</th>
              <th className="px-2 py-2 text-left">Top gene</th>
            </tr>
          </thead>
          <tbody className="font-light">
            {rows.map((l) => (
              <tr key={l.id}>
                <td className="px-2 py-1.5">
                  <Link href={`/locus/${l.id}/`} className="lnk font-normal">
                    {l.id}
                  </Link>
                </td>
                <td className="px-2 py-1.5 tabular-nums text-[var(--muted)]">
                  chr{l.chrom}:{(l.pos / 1e6).toFixed(2)} Mb
                </td>
                <td className="px-2 py-1.5 tabular-nums text-[var(--muted)]">
                  {l.topP.toExponential(0)}
                </td>
                {CHANNELS.map((c) => (
                  <Pp4Cell key={c.key} v={l.channels[c.key]} />
                ))}
                <td className="px-2 py-1.5">
                  <span
                    className="inline-block rounded-full px-2 py-0.5 text-[10px] font-normal"
                    style={{
                      background: `${attrMeta(l.attribution).color}22`,
                      color: attrMeta(l.attribution).color,
                      border: `1px solid ${attrMeta(l.attribution).color}55`,
                    }}
                  >
                    {attrMeta(l.attribution).label}
                  </span>
                </td>
                <td className="px-2 py-1.5 italic text-[var(--ink-dim)]">
                  {l.topNomination?.gene ?? l.bestBulkGene ?? "–"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
