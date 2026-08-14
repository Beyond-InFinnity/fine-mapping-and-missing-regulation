import type { Attribution, ChannelKey } from "./types";

export const CHANNELS: { key: ChannelKey; label: string; color: string }[] = [
  { key: "bulk", label: "Bulk expression", color: "#2a78d6" },
  { key: "susie", label: "coloc-SuSiE", color: "#5598e7" },
  { key: "sc", label: "Single-cell", color: "#1baf7a" },
  { key: "fetal", label: "Fetal eQTL", color: "#eda100" },
  { key: "sqtl", label: "Splicing", color: "#eb6834" },
  { key: "meqtl", label: "Methylation", color: "#7b2d8b" },
];

export const ATTRIBUTIONS: {
  key: Attribution;
  label: string;
  color: string;
}[] = [
  { key: "bulk_expression", label: "Bulk expression", color: "#2a78d6" },
  { key: "susie_rescue", label: "Multi-signal rescue", color: "#5598e7" },
  { key: "single_cell", label: "Single-cell eQTL", color: "#1baf7a" },
  { key: "fetal_eqtl", label: "Fetal eQTL", color: "#eda100" },
  { key: "splicing", label: "Splicing", color: "#eb6834" },
  { key: "methylation", label: "Methylation", color: "#7b2d8b" },
  { key: "unexplained", label: "Unexplained", color: "#9ca3af" },
];

export const attrMeta = (a: Attribution) =>
  ATTRIBUTIONS.find((x) => x.key === a) ?? ATTRIBUTIONS[6];

export const LD_COLORS: Record<number, string> = {
  5: "#7b2d8b",
  4: "#d43f3a",
  3: "#eea236",
  2: "#5cb85c",
  1: "#46b8da",
  0: "#2c3e50",
  [-1]: "#b8b8b8",
};

export const LD_LABELS: Record<number, string> = {
  5: "lead variant",
  4: "r² ≥ 0.8",
  3: "r² ≥ 0.6",
  2: "r² ≥ 0.4",
  1: "r² ≥ 0.2",
  0: "r² < 0.2",
  [-1]: "not in LD panel",
};
