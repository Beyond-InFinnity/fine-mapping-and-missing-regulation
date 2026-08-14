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
  const H = 240;
  const pad = { l: 34, r: 6, t: 14, b: 40 };
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
      {[0, 100, 200, total].map((t) => (
        <g key={t}>
          <line
            x1={pad.l}
            x2={W - pad.r}
            y1={y(t)}
            y2={y(t)}
            className="stroke-zinc-200 dark:stroke-zinc-800"
            strokeDasharray={t === total ? "4 3" : undefined}
          />
          <text
            x={pad.l - 5}
            y={y(t) + 3}
            textAnchor="end"
            className="fill-zinc-400 text-[9px]"
          >
            {t}
          </text>
        </g>
      ))}
      {bars.map((b) => {
        const x = pad.l + b.i * bw + bw * 0.14;
        const active = selected === null || selected === b.attr;
        return (
          <g
            key={b.attr}
            className="cursor-pointer"
            onClick={() => onSelect(selected === b.attr ? null : b.attr)}
          >
            <rect
              x={x}
              width={bw * 0.72}
              y={y(b.bottom + b.n)}
              height={y(b.bottom) - y(b.bottom + b.n)}
              rx={2}
              fill={b.meta.color}
              opacity={active ? 1 : 0.25}
            />
            <text
              x={x + bw * 0.36}
              y={y(b.bottom + b.n) - 4}
              textAnchor="middle"
              className="fill-zinc-700 text-[10px] font-medium dark:fill-zinc-200"
            >
              {b.n}
            </text>
            <text
              x={x + bw * 0.36}
              y={H - pad.b + 12}
              textAnchor="middle"
              className="fill-zinc-500 text-[8.5px]"
            >
              {b.meta.label.split(" ").slice(0, 2).join(" ")}
            </text>
            {b.meta.label.split(" ").length > 2 && (
              <text
                x={x + bw * 0.36}
                y={H - pad.b + 22}
                textAnchor="middle"
                className="fill-zinc-500 text-[8.5px]"
              >
                {b.meta.label.split(" ").slice(2).join(" ")}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
