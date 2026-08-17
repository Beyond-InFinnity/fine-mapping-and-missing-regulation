export type Reference = {
  key: string;
  authors: string;
  year: number;
  title: string;
  journal: string;
  doi: string;
};

// Alphabetical by first author; inline citation numbers follow this order.
// Mirrors the reference list in manuscript/manuscript.md.
export const REFERENCES: Reference[] = [
  {
    key: "bryois2022",
    authors: "Bryois J, et al.",
    year: 2022,
    title:
      "Cell-type-specific cis-eQTLs in eight human brain cell types identify novel risk genes for psychiatric and neurological disorders",
    journal: "Nat Neurosci",
    doi: "10.1038/s41593-022-01128-z",
  },
  {
    key: "byrska2022",
    authors: "Byrska-Bishop M, et al. (1000 Genomes Project)",
    year: 2022,
    title:
      "High-coverage whole-genome sequencing of the expanded 1000 Genomes Project cohort including 602 trios",
    journal: "Cell",
    doi: "10.1016/j.cell.2022.08.004",
  },
  {
    key: "connally2022",
    authors: "Connally NJ, et al.",
    year: 2022,
    title: "The missing link between genetic association and regulatory function",
    journal: "eLife",
    doi: "10.7554/eLife.74970",
  },
  {
    key: "deklein2023",
    authors: "de Klein N, et al.",
    year: 2023,
    title:
      "Brain expression quantitative trait locus and network analyses reveal downstream effects and putative drivers for brain-related diseases",
    journal: "Nat Genet",
    doi: "10.1038/s41588-023-01300-6",
  },
  {
    key: "giambartolomei2014",
    authors: "Giambartolomei C, et al.",
    year: 2014,
    title:
      "Bayesian test for colocalisation between pairs of genetic association studies using summary statistics",
    journal: "PLoS Genet",
    doi: "10.1371/journal.pgen.1004383",
  },
  {
    key: "gtex2020",
    authors: "GTEx Consortium",
    year: 2020,
    title:
      "The GTEx Consortium atlas of genetic regulatory effects across human tissues",
    journal: "Science",
    doi: "10.1126/science.aaz1776",
  },
  {
    key: "hannon2016",
    authors: "Hannon E, et al.",
    year: 2016,
    title:
      "Methylation QTLs in the developing brain and their enrichment in schizophrenia risk loci",
    journal: "Nat Neurosci",
    doi: "10.1038/nn.4182",
  },
  {
    key: "kerimov2021",
    authors: "Kerimov N, et al.",
    year: 2021,
    title:
      "A compendium of uniformly processed human gene expression and splicing quantitative trait loci",
    journal: "Nat Genet",
    doi: "10.1038/s41588-021-00924-w",
  },
  {
    key: "molder2021",
    authors: "Mölder F, et al.",
    year: 2021,
    title: "Sustainable data analysis with Snakemake",
    journal: "F1000Res",
    doi: "10.12688/f1000research.29032.2",
  },
  {
    key: "qi2018",
    authors: "Qi T, et al.",
    year: 2018,
    title:
      "Identifying gene targets for brain-related traits using transcriptomic and methylomic data from blood",
    journal: "Nat Commun",
    doi: "10.1038/s41467-018-04558-1",
  },
  {
    key: "roadmap2015",
    authors: "Roadmap Epigenomics Consortium",
    year: 2015,
    title: "Integrative analysis of 111 reference human epigenomes",
    journal: "Nature",
    doi: "10.1038/nature14248",
  },
  {
    key: "trubetskoy2022",
    authors: "Trubetskoy V, et al.",
    year: 2022,
    title:
      "Mapping genomic loci implicates genes and synaptic biology in schizophrenia",
    journal: "Nature",
    doi: "10.1038/s41586-022-04434-5",
  },
  {
    key: "walker2019",
    authors: "Walker RL, et al.",
    year: 2019,
    title:
      "Genetic control of expression and splicing in developing human brain informs disease mechanisms",
    journal: "Cell",
    doi: "10.1016/j.cell.2019.09.021",
  },
  {
    key: "wallace2021",
    authors: "Wallace C",
    year: 2021,
    title:
      "A more accurate method for colocalisation analysis allowing for multiple causal variants",
    journal: "PLoS Genet",
    doi: "10.1371/journal.pgen.1009440",
  },
  {
    key: "wang2020",
    authors: "Wang G, et al.",
    year: 2020,
    title:
      "A simple new approach to variable selection in regression, with application to genetic fine mapping",
    journal: "J R Stat Soc B",
    doi: "10.1111/rssb.12388",
  },
  {
    key: "zou2022",
    authors: "Zou Y, et al.",
    year: 2022,
    title:
      "Fine-mapping from summary data with the “Sum of Single Effects” model",
    journal: "PLoS Genet",
    doi: "10.1371/journal.pgen.1010299",
  },
];

export const refByKey = (key: string) =>
  REFERENCES.find((r) => r.key === key);

export const refNumber = (key: string) =>
  REFERENCES.findIndex((r) => r.key === key) + 1;
