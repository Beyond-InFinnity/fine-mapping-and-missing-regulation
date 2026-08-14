"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CHANNELS, attrMeta } from "@/lib/channels";
import type { Attribution, ChannelKey, Locus } from "@/lib/types";

type SortKey = "pos" | "topP" | ChannelKey;

function Pp4Cell({ v }: { v: number | null }) {
  if (v === null) return <td className="px-2 py-1 text-zinc-400">–</td>;
  const strong = v >= 0.8;
  return (
    <td
      className={`px-2 py-1 tabular-nums ${
        strong
          ? "font-semibold text-blue-700 dark:text-blue-400"
          : "text-zinc-600 dark:text-zinc-300"
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
      className="cursor-pointer select-none px-2 py-1.5 text-left font-medium hover:text-zinc-900 dark:hover:text-white"
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
      <div className="mb-2 flex items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search locus, rsID, or gene…"
          className="w-64 rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <span className="text-xs text-zinc-500">
          {rows.length} of {loci.length} loci
          {filter ? ` · attribution: ${attrMeta(filter).label}` : ""}
        </span>
      </div>
      <div className="max-h-[480px] overflow-auto rounded border border-zinc-200 dark:border-zinc-800">
        <table className="w-full min-w-[760px] text-xs">
          <thead className="sticky top-0 bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
            <tr>
              <th className="px-2 py-1.5 text-left font-medium">Locus</th>
              {th("pos", "Position")}
              {th("topP", "GWAS p")}
              {CHANNELS.map((c) => th(c.key, c.label.split(" ")[0]))}
              <th className="px-2 py-1.5 text-left font-medium">
                Attribution
              </th>
              <th className="px-2 py-1.5 text-left font-medium">Top gene</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((l) => (
              <tr
                key={l.id}
                className="border-t border-zinc-100 hover:bg-zinc-50 dark:border-zinc-800/60 dark:hover:bg-zinc-900"
              >
                <td className="px-2 py-1">
                  <Link
                    href={`/locus/${l.id}/`}
                    className="font-medium text-blue-700 hover:underline dark:text-blue-400"
                  >
                    {l.id}
                  </Link>
                </td>
                <td className="px-2 py-1 tabular-nums text-zinc-500">
                  chr{l.chrom}:{(l.pos / 1e6).toFixed(2)} Mb
                </td>
                <td className="px-2 py-1 tabular-nums text-zinc-500">
                  {l.topP.toExponential(0)}
                </td>
                {CHANNELS.map((c) => (
                  <Pp4Cell key={c.key} v={l.channels[c.key]} />
                ))}
                <td className="px-2 py-1">
                  <span
                    className="inline-block rounded-full px-2 py-0.5 text-[10px] text-white"
                    style={{ background: attrMeta(l.attribution).color }}
                  >
                    {attrMeta(l.attribution).label}
                  </span>
                </td>
                <td className="px-2 py-1 italic">
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
