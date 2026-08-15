"use client";

import { ATTRIBUTIONS } from "@/lib/channels";
import type { Attribution, Summary } from "@/lib/types";

const STEP_TO_ATTR: Record<string, Attribution> = {
  bulk_expression: "bulk_expression",
  susie_rescue: "susie_rescue",
  single_cell: "single_cell",
  fetal_eqtl: "fetal_eqtl",
  splicing: "splicing",
  methylation: "methylation",
};

const SHORT: Record<Attribution, string[]> = {
  bulk_expression: ["Bulk", "expression"],
  susie_rescue: ["Multi-signal", "rescue"],
  single_cell: ["Single-cell", "eQTL"],
  fetal_eqtl: ["Fetal", "eQTL"],
  splicing: ["Splicing", ""],
  methylation: ["Methylation", ""],
  unexplained: ["Unexplained", ""],
};

export default function Waterfall({
  summary,
  selected,
  onSelect,
}: {
  summary: Summary;
  selected: Attribution | null;
  onSelect: (a: Attribution | null) => void;
}) {
  const steps: { attr: Attribution; n: number }[] = [
    ...summary.ledger.map((e) => ({
      attr: STEP_TO_ATTR[e.channel],
      n: e.newly_explained,
    })),
    { attr: "unexplained" as Attribution, n: summary.nUnexplained },
  ];
  const total = summary.nLoci;
  const W = 720;
  const H = 460;
  const pad = { l: 40, r: 8, t: 22, b: 58 };
  const bw = (W - pad.l - pad.r) / steps.length;
  const y = (v: number) => pad.t + (1 - v / total) * (H - pad.t - pad.b);

  let base = 0;
  const bars = steps.map((s, i) => {
    const b = s.attr === "unexplained" ? total - s.n : base;
    const meta = ATTRIBUTIONS.find((a) => a.key === s.attr)!;
    const bar = { ...s, i, bottom: b, meta };
    if (s.attr !== "unexplained") base += s.n;
    return bar;
  });

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label="Sequential attribution of loci across channels"
    >
      {[0, 100, 200].map((t) => (
        <g key={t}>
          <line
            x1={pad.l}
            x2={W - pad.r}
            y1={y(t)}
            y2={y(t)}
            stroke="rgba(214,222,240,0.09)"
          />
          <text
            x={pad.l - 6}
            y={y(t) + 3.5}
            textAnchor="end"
            fill="var(--muted)"
            fontSize={11}
          >
            {t}
          </text>
        </g>
      ))}
      <line
        x1={pad.l}
        x2={W - pad.r}
        y1={y(total)}
        y2={y(total)}
        stroke="var(--rose)"
        strokeWidth={1}
        strokeDasharray="5 4"
        opacity={0.8}
      />
      <text
        x={pad.l + 2}
        y={y(total) - 6}
        fill="var(--rose)"
        fontSize={10.5}
        letterSpacing={1.5}
      >
        ALL {total} LOCI
      </text>
      {bars.map((b) => {
        const x = pad.l + b.i * bw + bw * 0.13;
        const active = selected === null || selected === b.attr;
        const cx = x + bw * 0.37;
        return (
          <g
            key={b.attr}
            className="cursor-pointer"
            onClick={() => onSelect(selected === b.attr ? null : b.attr)}
          >
            <rect
              x={x}
              width={bw * 0.74}
              y={y(b.bottom + b.n)}
              height={y(b.bottom) - y(b.bottom + b.n)}
              rx={2.5}
              fill={b.meta.color}
              opacity={active ? 1 : 0.22}
            />
            {b.i < bars.length - 1 && b.attr !== "unexplained" && (
              <line
                x1={x + bw * 0.74}
                x2={pad.l + (b.i + 1) * bw + bw * 0.13}
                y1={y(b.bottom + b.n)}
                y2={y(b.bottom + b.n)}
                stroke="var(--muted)"
                strokeDasharray="2 3"
                opacity={0.6}
              />
            )}
            <text
              x={cx}
              y={y(b.bottom + b.n) - 7}
              textAnchor="middle"
              fill="var(--ink)"
              fontSize={15}
              fontWeight={600}
              opacity={active ? 1 : 0.35}
            >
              {b.n}
            </text>
            <text
              x={cx}
              y={H - pad.b + 22}
              textAnchor="middle"
              fill={active ? "var(--ink-dim)" : "var(--muted)"}
              fontSize={12.5}
              fontWeight={500}
              letterSpacing={0.2}
            >
              {SHORT[b.attr][0]}
            </text>
            {SHORT[b.attr][1] && (
              <text
                x={cx}
                y={H - pad.b + 37}
                textAnchor="middle"
                fill={active ? "var(--ink-dim)" : "var(--muted)"}
                fontSize={11}
                fontWeight={500}
                letterSpacing={0.6}
              >
                {SHORT[b.attr][1]}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
