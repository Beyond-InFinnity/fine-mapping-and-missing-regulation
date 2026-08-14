export type ChannelKey = "bulk" | "susie" | "sc" | "fetal" | "sqtl" | "meqtl";

export type Attribution =
  | "bulk_expression"
  | "susie_rescue"
  | "single_cell"
  | "fetal_eqtl"
  | "splicing"
  | "methylation"
  | "unexplained";

export interface Locus {
  id: string;
  chrom: string;
  pos: number;
  indexSnp: string;
  topP: number;
  attribution: Attribution;
  channels: Record<ChannelKey, number | null>;
  bestBulkGene: string | null;
  bestScCt: string | null;
  nGwasCs: number | null;
  fetalRegPip: number | null;
  adultRegPip: number | null;
  nNominations: number;
  topNomination: { gene: string; score: number } | null;
}

export interface Nomination {
  locusId: string;
  orphan: boolean;
  gene: string;
  symbol: string | null;
  tier: "high" | "suggestive";
  score: number;
  cpg: string;
  cpgGwasPp4: number;
  cpgGenePp4: number;
  tssDist: number | null;
  directPp4: number | null;
}

export interface Summary {
  nLoci: number;
  ledger: { channel: string; newly_explained: number; total_hits: number }[];
  nUnexplained: number;
  stage1Fractions: Record<
    string,
    { n_colocalized: number; n_analysed: number; fraction: number }
  >;
  power: {
    ladder: { dataset: string; n_eqtl: number; frac_coloc: number }[];
    logit_or_per_10x_n: number;
    logit_p: number;
  };
  nominations: { lociAny: number; lociHigh: number; orphanHigh: number };
}

export interface RegionalTrack {
  label: string;
  pts: [number, number, number][]; // pos, -log10 p, ldBin (5 lead, 4..0, -1 absent)
}

export interface RegionalData {
  title: string;
  chrom: string;
  leadPos: number;
  leadKey: string;
  tracks: RegionalTrack[];
  genes: { n: string; s: number; e: number }[];
}
