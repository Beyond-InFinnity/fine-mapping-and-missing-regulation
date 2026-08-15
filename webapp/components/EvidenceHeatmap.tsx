"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ATTRIBUTIONS, CHANNELS, attrMeta } from "@/lib/channels";
import type { Attribution, Locus } from "@/lib/types";

const ATTR_ORDER: Attribution[] = ATTRIBUTIONS.map((a) => a.key);

function pp4Color(v: number | null): string {
  if (v === null) return "transparent";
  const t = Math.max(0, Math.min(1, v));
  // dark surface ramp: near-background navy -> blue -> bright ice
  const stops =
    t < 0.55
      ? { a: [21, 29, 46], b: [42, 120, 214], f: t / 0.55 }
      : { a: [42, 120, 214], b: [207, 230, 255], f: (t - 0.55) / 0.45 };
  const c = stops.a.map((x, i) => Math.round(x + (stops.b[i] - x) * stops.f));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

export default function EvidenceHeatmap({
  loci,
  filter,
}: {
  loci: Locus[];
  filter: Attribution | null;
}) {
  const router = useRouter();
  const [hover, setHover] = useState<{
    locus: Locus;
    ch: string;
    v: number | null;
    x: number;
    y: number;
  } | null>(null);

  const ordered = useMemo(() => {
    const rank = new Map(ATTR_ORDER.map((a, i) => [a, i]));
    return [...loci].sort(
      (a, b) =>
        rank.get(a.attribution)! - rank.get(b.attribution)! ||
        (b.channels.bulk ?? 0) - (a.channels.bulk ?? 0),
    );
  }, [loci]);

  const W = 460;
  const rowH = 2.2;
  const stripW = 10;
  const cellW = (W - stripW - 4) / CHANNELS.length;
  const H = ordered.length * rowH;

  return (
    <div className="relative">
      <div className="mb-1.5 flex" style={{ paddingLeft: stripW + 4 }}>
        {CHANNELS.map((c) => (
          <div
            key={c.key}
            className="text-[11px] text-[var(--muted)]"
            style={{ width: `${(100 / CHANNELS.length).toFixed(2)}%` }}
          >
            {c.label}
          </div>
        ))}
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        onMouseLeave={() => setHover(null)}
        role="img"
        aria-label="Best PP4 per locus and channel"
      >
        {ordered.map((l, r) => {
          const dim = filter !== null && l.attribution !== filter;
          return (
            <g
              key={l.id}
              opacity={dim ? 0.15 : 1}
              className="cursor-pointer"
              onClick={() => router.push(`/locus/${l.id}/`)}
            >
              <rect
                x={0}
                y={r * rowH}
                width={stripW}
                height={rowH}
                fill={attrMeta(l.attribution).color}
              />
              {CHANNELS.map((c, ci) => (
                <rect
                  key={c.key}
                  x={stripW + 4 + ci * cellW}
                  y={r * rowH}
                  width={cellW - 1}
                  height={rowH}
                  fill={pp4Color(l.channels[c.key])}
                  onMouseEnter={(e) => {
                    const svg = (e.target as SVGElement).ownerSVGElement!;
                    const box = svg.getBoundingClientRect();
                    setHover({
                      locus: l,
                      ch: c.label,
                      v: l.channels[c.key],
                      x: ((stripW + 4 + ci * cellW) / W) * box.width,
                      y: ((r * rowH) / H) * box.height,
                    });
                  }}
                />
              ))}
            </g>
          );
        })}
      </svg>
      {hover && (
        <div
          className="pointer-events-none absolute z-10 rounded border border-[var(--line)] bg-[var(--panel-2)] px-2 py-1 text-[11px] text-[var(--ink)] shadow-lg"
          style={{
            left: Math.min(hover.x + 12, 320),
            top: Math.max(hover.y - 30, 0),
          }}
        >
          <span className="font-medium text-[var(--gold-bright)]">
            {hover.locus.id}
          </span>{" "}
          · {hover.ch}: {hover.v === null ? "not tested" : hover.v.toFixed(2)}
        </div>
      )}
    </div>
  );
}
