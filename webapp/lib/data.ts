import lociJson from "@/data/loci.json";
import nominationsJson from "@/data/nominations.json";
import summaryJson from "@/data/summary.json";
import type { Locus, Nomination, Summary } from "./types";

export const loci = lociJson as unknown as Locus[];
export const nominations = nominationsJson as unknown as Nomination[];
export const summary = summaryJson as unknown as Summary;

export const locusById = new Map(loci.map((l) => [l.id, l]));

export const nominationsByLocus = (() => {
  const m = new Map<string, Nomination[]>();
  for (const n of nominations) {
    const arr = m.get(n.locusId) ?? [];
    arr.push(n);
    m.set(n.locusId, arr);
  }
  for (const arr of m.values()) arr.sort((a, b) => b.score - a.score);
  return m;
})();

export const fmtP = (p: number) => {
  if (p === 0) return "0";
  const e = Math.floor(Math.log10(p));
  const m = p / 10 ** e;
  return `${m.toFixed(1)}×10${sup(e)}`;
};

const SUP: Record<string, string> = {
  "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
  "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
  "-": "⁻",
};
const sup = (n: number) =>
  String(n).split("").map((c) => SUP[c] ?? c).join("");

export const fmtPos = (chrom: string, pos: number) =>
  `chr${chrom}:${pos.toLocaleString("en-US")}`;
