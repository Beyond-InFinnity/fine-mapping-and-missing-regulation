"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LD_COLORS, LD_LABELS } from "@/lib/channels";
import type { RegionalData } from "@/lib/types";

const TRACK_H = 150;
const GENE_ROW_H = 16;
const PAD = { l: 46, r: 12, t: 8, b: 4 };

function Track({
  pts,
  label,
  xmin,
  xmax,
  leadPos,
}: {
  pts: [number, number, number][];
  label: string;
  xmin: number;
  xmax: number;
  leadPos: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [hover, setHover] = useState<{
    x: number;
    y: number;
    pos: number;
    logp: number;
    bin: number;
  } | null>(null);
  const [width, setWidth] = useState(800);

  const ymax = useMemo(
    () => Math.max(8, Math.ceil(Math.max(...pts.map((p) => p[1])) * 1.08)),
    [pts],
  );

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const w = cv.parentElement?.clientWidth ?? 800;
    setWidth(w);
    const dpr = window.devicePixelRatio || 1;
    cv.width = w * dpr;
    cv.height = TRACK_H * dpr;
    cv.style.width = `${w}px`;
    cv.style.height = `${TRACK_H}px`;
    const ctx = cv.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, TRACK_H);

    const xs = (p: number) =>
      PAD.l + ((p - xmin) / (xmax - xmin)) * (w - PAD.l - PAD.r);
    const ys = (v: number) =>
      PAD.t + (1 - v / ymax) * (TRACK_H - PAD.t - PAD.b);

    // gridlines
    ctx.strokeStyle = "rgba(128,128,128,0.18)";
    ctx.lineWidth = 1;
    for (let g = 0; g <= ymax; g += ymax > 12 ? 5 : 2) {
      ctx.beginPath();
      ctx.moveTo(PAD.l, ys(g));
      ctx.lineTo(w - PAD.r, ys(g));
      ctx.stroke();
    }
    // points: draw low-LD first so colored points sit on top
    const order = [...pts].sort((a, b) => a[2] - b[2]);
    for (const [pos, logp, bin] of order) {
      ctx.fillStyle = LD_COLORS[bin] ?? "#888";
      if (bin === 5) {
        const x = xs(pos);
        const y = ys(logp);
        ctx.beginPath();
        ctx.moveTo(x, y - 5);
        ctx.lineTo(x + 5, y);
        ctx.lineTo(x, y + 5);
        ctx.lineTo(x - 5, y);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "white";
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(xs(pos), ys(logp), 2.1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // y-axis labels
    ctx.fillStyle = "rgba(128,128,128,0.9)";
    ctx.font = "9px system-ui";
    ctx.textAlign = "right";
    for (let g = 0; g <= ymax; g += ymax > 12 ? 5 : 2)
      ctx.fillText(String(g), PAD.l - 5, ys(g) + 3);
  }, [pts, xmin, xmax, ymax, leadPos]);

  const onMove = (e: React.MouseEvent) => {
    const cv = ref.current!;
    const rect = cv.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const xs = (p: number) =>
      PAD.l + ((p - xmin) / (xmax - xmin)) * (rect.width - PAD.l - PAD.r);
    const ys = (v: number) =>
      PAD.t + (1 - v / ymax) * (TRACK_H - PAD.t - PAD.b);
    let best: typeof hover = null;
    let bestD = 100;
    for (const [pos, logp, bin] of pts) {
      const dx = xs(pos) - mx;
      const dy = ys(logp) - my;
      const d = dx * dx + dy * dy;
      if (d < bestD) {
        bestD = d;
        best = { x: xs(pos), y: ys(logp), pos, logp, bin };
      }
    }
    setHover(best);
  };

  return (
    <div className="relative">
      <div className="absolute left-12 top-1 z-10 text-xs font-semibold">
        {label}
      </div>
      <div className="absolute -left-1 top-1/2 z-10 -rotate-90 text-[9px] text-zinc-400">
        −log₁₀(p)
      </div>
      <canvas
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        className="w-full"
      />
      {hover && (
        <div
          className="pointer-events-none absolute z-20 rounded border border-zinc-300 bg-white px-2 py-1 text-[11px] shadow dark:border-zinc-700 dark:bg-zinc-900"
          style={{
            left: Math.min(hover.x + 10, width - 190),
            top: Math.max(hover.y - 34, 0),
          }}
        >
          {(hover.pos / 1e6).toFixed(3)} Mb · −log₁₀(p) ={" "}
          {hover.logp.toFixed(1)} · {LD_LABELS[hover.bin]}
        </div>
      )}
    </div>
  );
}

export default function RegionalPlot({ src }: { src: string }) {
  const [data, setData] = useState<RegionalData | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [visible, setVisible] = useState<boolean[]>([]);

  useEffect(() => {
    fetch(src)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: RegionalData) => {
        setData(d);
        setVisible(d.tracks.map(() => true));
      })
      .catch((e) => setErr(String(e)));
  }, [src]);

  if (err)
    return (
      <div className="rounded border border-red-300 p-4 text-sm text-red-700">
        Failed to load regional data: {err}
      </div>
    );
  if (!data) return <div className="p-4 text-sm text-zinc-500">Loading…</div>;

  const xmin = Math.min(...data.tracks.flatMap((t) => t.pts.map((p) => p[0])));
  const xmax = Math.max(...data.tracks.flatMap((t) => t.pts.map((p) => p[0])));

  const geneRows: { n: string; s: number; e: number; row: number }[] = [];
  const rowEnds: number[] = [];
  for (const g of [...data.genes].sort((a, b) => a.s - b.s)) {
    let row = 0;
    while (row < rowEnds.length && g.s < rowEnds[row] + (xmax - xmin) * 0.01)
      row++;
    rowEnds[row] = g.e;
    geneRows.push({ ...g, row });
  }
  const nRows = rowEnds.length;

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-4 text-xs">
        {data.tracks.length > 1 &&
          data.tracks.map((t, i) => (
            <label key={t.label} className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={visible[i] ?? true}
                onChange={() =>
                  setVisible((v) => v.map((x, j) => (j === i ? !x : x)))
                }
              />
              {t.label}
            </label>
          ))}
        <span className="ml-auto flex flex-wrap gap-2 text-[10px] text-zinc-500">
          {[4, 3, 2, 1, 0].map((b) => (
            <span key={b} className="flex items-center gap-1">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: LD_COLORS[b] }}
              />
              {LD_LABELS[b]}
            </span>
          ))}
        </span>
      </div>
      {data.tracks.map(
        (t, i) =>
          (visible[i] ?? true) && (
            <Track
              key={t.label}
              pts={t.pts}
              label={t.label}
              xmin={xmin}
              xmax={xmax}
              leadPos={data.leadPos}
            />
          ),
      )}
      <svg
        viewBox={`0 0 800 ${nRows * GENE_ROW_H + 24}`}
        className="w-full"
        role="img"
        aria-label="Protein-coding genes in the region"
      >
        {geneRows.map((g) => {
          const x1 = PAD.l + ((g.s - xmin) / (xmax - xmin)) * (800 - PAD.l - PAD.r);
          const x2 = PAD.l + ((g.e - xmin) / (xmax - xmin)) * (800 - PAD.l - PAD.r);
          const y = 6 + g.row * GENE_ROW_H;
          return (
            <g key={`${g.n}-${g.s}`}>
              <rect
                x={Math.max(PAD.l, x1)}
                y={y}
                width={Math.max(2, Math.min(x2, 800 - PAD.r) - Math.max(PAD.l, x1))}
                height={4}
                className="fill-zinc-500"
              />
              <text
                x={(Math.max(PAD.l, x1) + Math.min(x2, 800 - PAD.r)) / 2}
                y={y + 12}
                textAnchor="middle"
                className="fill-zinc-500 text-[7px] italic"
              >
                {g.n}
              </text>
            </g>
          );
        })}
        <text
          x={400}
          y={nRows * GENE_ROW_H + 20}
          textAnchor="middle"
          className="fill-zinc-400 text-[9px]"
        >
          chromosome {data.chrom} position (GRCh38); {(xmin / 1e6).toFixed(2)}
          –{(xmax / 1e6).toFixed(2)} Mb
        </text>
      </svg>
    </div>
  );
}
