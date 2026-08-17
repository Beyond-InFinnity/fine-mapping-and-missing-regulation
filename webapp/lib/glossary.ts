export type GlossaryEntry = {
  slug: string;
  term: string;
  short: string; // popover text, 1-2 sentences
  long: string; // full entry on the glossary page
  seeAlso?: string[]; // slugs of related entries
};

// Kept in alphabetical order by term; the glossary page groups by first letter.
export const GLOSSARY: GlossaryEntry[] = [
  {
    slug: "bulk-tissue",
    term: "Bulk tissue",
    short:
      "Gene activity measured in a homogenized piece of tissue, averaging over all the cell types it contains.",
    long:
      "Most expression datasets measure RNA from a homogenized piece of tissue, so every value is an average over neurons, glia, and all other cell types in the sample. An effect confined to one cell type is diluted by the rest, which is one proposed reason risk variants fail to match bulk eQTLs. Single-cell eQTL data address this directly by measuring expression per cell type.",
    seeAlso: ["single-cell-eqtl", "eqtl"],
  },
  {
    slug: "colocalization",
    term: "Colocalization",
    short:
      "A statistical test of whether two association signals in the same region, one from the GWAS and one from a molecular trait, are consistent with a single shared causal variant.",
    long:
      "When a GWAS signal and a molecular QTL sit in the same genomic window, colocalization asks whether the two signals point at the same underlying causal variant or at two different variants that happen to be neighbors. The coloc method compares five hypotheses, from no association at all (H0) through two independent signals (H3) to one shared causal variant (H4), and reports a posterior probability for each. This site uses PP4, the probability of the shared-variant hypothesis, with a threshold of 0.8. Colocalization is evidence of a shared cause, not proof that the molecular trait transmits the disease effect.",
    seeAlso: ["pp4", "eqtl", "ld"],
  },
  {
    slug: "cpg",
    term: "CpG site and DNA methylation",
    short:
      "A DNA position where a methyl group can attach. Methylation at CpG sites tracks the regulatory activity of nearby DNA.",
    long:
      "DNA methylation is a chemical mark, a methyl group added to a cytosine base, occurring mainly at CpG dinucleotides. Methylation levels vary between people, are partly controlled by nearby genetic variants, and correlate with the regulatory state of the surrounding DNA, since promoters and enhancers change methylation as they switch on and off. The Brain-mMeta dataset used here measured methylation in roughly 1,160 human brains. A methylation association marks regulatory activity but does not by itself say which gene is affected or in which direction.",
    seeAlso: ["mqtl", "regulatory-chromatin", "methylation-chain"],
  },
  {
    slug: "credible-set",
    term: "Credible set",
    short:
      "The smallest set of variants that, together, has a 95% probability of containing the causal variant for one association signal.",
    long:
      "Fine-mapping cannot usually name a single causal variant, but it can shrink the candidate list. A 95% credible set is the smallest group of variants whose combined posterior probability reaches 95% for one independent signal; a locus with several independent signals has several credible sets, and 40% of the loci analyzed here carry two or more. On the locus pages, credible-set mass in regulatory chromatin is the fraction of a set's probability that falls on variants inside enhancer or promoter states.",
    seeAlso: ["fine-mapping", "susie", "regulatory-chromatin"],
  },
  {
    slug: "eqtl",
    term: "eQTL (expression quantitative trait locus)",
    short:
      "A genetic variant associated with how much of a gene is expressed. Brain eQTLs are the standard tool for guessing which gene a risk locus regulates.",
    long:
      "An expression quantitative trait locus is a variant whose alleles are associated with higher or lower expression of a nearby gene, measured across many donors. If a schizophrenia risk variant is also an eQTL for a gene in brain tissue, and colocalization confirms that the two signals share a causal variant, that gene becomes the leading candidate for the locus. This project tested 13 GTEx brain regions plus the much larger MetaBrain cortex meta-analysis.",
    seeAlso: ["expression", "colocalization", "bulk-tissue"],
  },
  {
    slug: "expression-orphan",
    term: "Expression-orphan locus",
    short:
      "A locus with no expression-based colocalization of any kind: bulk, multi-signal, single-cell, fetal, or splicing.",
    long:
      "A risk locus is an expression orphan when no expression-based test links it to a gene: no bulk eQTL, no fine-mapped multi-signal pairing, no single-cell or fetal eQTL, and no splicing QTL reaches PP4 above 0.8. These loci are where the methylation chain matters most, since it can nominate a gene by routing through a shared methylation signal; 44 orphan loci received a high-tier nomination this way.",
    seeAlso: ["methylation-chain", "tier"],
  },
  {
    slug: "fine-mapping",
    term: "Fine-mapping",
    short:
      "Statistical narrowing of an association signal from a broad region of correlated variants to a small set of candidate causal variants.",
    long:
      "GWAS associations arrive as broad peaks because linkage disequilibrium correlates neighboring variants. Fine-mapping models the association pattern together with LD to estimate, for each variant, the probability that it is the causal one, and to split a region into independent signals when more than one exists. This project fine-mapped every locus with SuSiE, using LD computed from 503 European-ancestry 1000 Genomes samples. The results feed the multi-signal colocalization channel and the credible-set annotations on each locus page.",
    seeAlso: ["susie", "credible-set", "ld"],
  },
  {
    slug: "expression",
    term: "Gene expression",
    short:
      "The process of reading a gene into RNA. Expression level means how much RNA a gene produces in a given tissue.",
    long:
      "Genes act by being transcribed into RNA and, for protein-coding genes, translated into protein. Expression level, the amount of RNA a gene produces, differs between tissues, cell types, developmental stages, and people. Regulatory DNA variants change expression rather than the protein itself, which is why expression data sit at the center of interpreting GWAS loci.",
    seeAlso: ["eqtl", "regulatory-variant"],
  },
  {
    slug: "gwas",
    term: "GWAS (genome-wide association study)",
    short:
      "A scan across millions of DNA variants asking which are more common in people with a condition than in people without it.",
    long:
      "A genome-wide association study genotypes a large sample of cases and controls and tests each variant, typically millions of them, for a difference in frequency between the two groups. Significance thresholds are strict (p below 5 per hundred million) because so many tests are run. The schizophrenia GWAS used here, PGC3, compared 67,390 cases with 94,015 controls and reported 287 significant regions. A GWAS says where risk-associated variation lies; it does not say which variant is causal or which gene it acts through.",
    seeAlso: ["pgc3", "locus", "summary-statistics"],
  },
  {
    slug: "index-variant",
    term: "Index variant",
    short:
      "The variant with the smallest p-value at a locus. A bookmark for the region, not necessarily the causal variant.",
    long:
      "Each locus is labeled by its index variant, also called the lead SNP: the variant with the strongest association in the region. Because of linkage disequilibrium, the index variant is often just the best-measured proxy for a causal variant nearby. Locus identifiers on this site combine the chromosome with the index rsID, and the regional plots color every other variant by its correlation with the lead.",
    seeAlso: ["ld", "locus", "fine-mapping"],
  },
  {
    slug: "ld",
    term: "Linkage disequilibrium (LD)",
    short:
      "The correlation between nearby variants that are inherited together, which smears association signals across whole regions.",
    long:
      "Variants that sit close together on a chromosome tend to be inherited as a block, so their genotypes are correlated across a population. This correlation is linkage disequilibrium, quantified by r squared. LD is why a single causal variant produces a broad GWAS peak, why colocalization must compare whole signals rather than single variants, and why fine-mapping is needed at all. The LD reference used here is 503 European-ancestry genomes from the 1000 Genomes Project.",
    seeAlso: ["index-variant", "fine-mapping", "colocalization"],
  },
  {
    slug: "locus",
    term: "Locus",
    short:
      "A region of the genome. In GWAS usage, a stretch of correlated variants containing one or more association signals.",
    long:
      "A risk locus is the unit of a GWAS result: a genomic region, often hundreds of kilobases wide, containing an association signal and everything correlated with it. A locus typically spans several genes, and the gene nearest the strongest variant is frequently not the true target, which is exactly why the variant-to-gene problem exists. PGC3 reported 287 schizophrenia loci; the 281 autosomal loci outside the extended MHC region are analyzed here.",
    seeAlso: ["index-variant", "gwas", "ld"],
  },
  {
    slug: "methylation-chain",
    term: "Methylation chain",
    short:
      "A two-step link: the GWAS signal shares a variant with a CpG's methylation signal, and that same methylation signal shares a variant with a gene's expression. The chain score is the weaker of the two links.",
    long:
      "Where no direct expression colocalization exists, a gene can still be nominated transitively. Step one: the GWAS signal colocalizes with a methylation QTL at some CpG site. Step two: the same CpG's methylation QTL colocalizes with the expression of a gene in independent expression data. The chain score is the minimum of the two PP4 values, so a chain is only as strong as its weaker link. Chained nominations are ranked hypotheses for follow-up, not demonstrations of mechanism; the methylation signal may mediate the effect, respond to it, or simply mark the same regulatory element.",
    seeAlso: ["cpg", "mqtl", "tier", "expression-orphan"],
  },
  {
    slug: "mqtl",
    term: "mQTL (methylation quantitative trait locus)",
    short:
      "A variant associated with the methylation level of a specific CpG site. Also written meQTL.",
    long:
      "A methylation quantitative trait locus is a variant whose alleles track higher or lower methylation at a particular CpG site. Brain mQTLs from the Brain-mMeta meta-analysis colocalized with 193 of the 281 schizophrenia loci, more than twice the count of the bulk expression channel and six times its rate on a per-test basis. Because methylation marks regulatory DNA without naming a target gene, an mQTL colocalization places the risk variant on active chromatin but leaves gene identity to the methylation chain.",
    seeAlso: ["cpg", "methylation-chain", "colocalization"],
  },
  {
    slug: "tier",
    term: "Nomination tier",
    short:
      "Confidence band for a chained gene nomination: high means chain score at or above 0.8, suggestive means 0.5 to 0.8.",
    long:
      "Gene nominations are banded by their chain score, the weaker of the chain's two colocalization links. High tier requires both links at PP4 of 0.8 or more, the same threshold used for direct colocalization everywhere else on this site. The suggestive tier (0.5 to 0.8) is provided for completeness and filtering; treat it as a weaker hypothesis, not as a finding.",
    seeAlso: ["methylation-chain", "pp4"],
  },
  {
    slug: "regulatory-variant",
    term: "Non-coding (regulatory) variant",
    short:
      "A variant outside protein-coding sequence, presumed to act by changing when, where, or how strongly genes are used.",
    long:
      "The large majority of GWAS associations land outside protein-coding sequence. Such variants cannot change a protein's composition, so the prevailing model holds that they alter regulatory elements, promoters and enhancers, and thereby shift the expression of nearby genes. This regulatory hypothesis is the premise the whole project stress-tests: if it holds, risk loci should colocalize with QTLs for expression or for other regulatory readouts such as methylation.",
    seeAlso: ["expression", "regulatory-chromatin", "eqtl"],
  },
  {
    slug: "pgc3",
    term: "PGC3",
    short:
      "The third schizophrenia GWAS of the Psychiatric Genomics Consortium (Trubetskoy et al. 2022): 287 risk loci, of which 281 are analyzed here.",
    long:
      "PGC3 is shorthand for the third and largest schizophrenia genome-wide association study from the Psychiatric Genomics Consortium, published by Trubetskoy and colleagues in 2022. Its core meta-analysis of 67,390 cases and 94,015 controls identified 287 genome-wide significant loci. This project excludes the extended MHC region, whose long-range LD defeats locus-level analysis, and five chromosome X loci, leaving 281.",
    seeAlso: ["gwas", "locus"],
  },
  {
    slug: "pp4",
    term: "PP4",
    short:
      "The posterior probability that a GWAS signal and a molecular QTL share one causal variant. This site calls a pair colocalized when PP4 exceeds 0.8.",
    long:
      "The coloc framework weighs five hypotheses for a pair of association signals in one region: no signal (H0), a signal in only one trait (H1, H2), two distinct causal variants (H3), and one shared causal variant (H4). PP4 is the posterior probability of H4. Values above 0.8 are treated as colocalized throughout this site; the central methylation results also hold at 0.9 and 0.95. A low PP4 alongside a high PP3 is informative too: it says both signals exist but favor different variants.",
    seeAlso: ["colocalization"],
  },
  {
    slug: "regulatory-chromatin",
    term: "Regulatory chromatin",
    short:
      "Stretches of DNA marked as active promoters or enhancers in reference epigenome maps (chromHMM states from the Roadmap project).",
    long:
      "Chromatin, DNA together with its packaging proteins, carries chemical marks that distinguish active regulatory elements from silent DNA. The Roadmap Epigenomics project segmented the genomes of many tissues, including fetal and adult brain, into states such as active promoter and enhancer using the chromHMM model. On the locus pages, credible-set mass in regulatory chromatin is the fraction of fine-mapping probability that falls in those states; a high fetal value beside a low adult value hints that a variant acts during development.",
    seeAlso: ["credible-set", "cpg"],
  },
  {
    slug: "attribution",
    term: "Sequential attribution",
    short:
      "Each locus is assigned to the first evidence channel that explains it, applying the channels in a fixed order from most direct to most indirect.",
    long:
      "The bookkeeping rule behind the waterfall figure. The six evidence channels are applied in a fixed order (bulk expression, multi-signal rescue, single-cell eQTL, fetal eQTL, splicing, methylation), and each locus is credited to the first channel that produces a colocalization at PP4 above 0.8. A locus explained by both splicing and methylation therefore counts under splicing. The order encodes an evidentiary preference, from the most direct and best-replicated evidence toward the most indirect, and later channels receive only the loci that earlier ones missed.",
    seeAlso: ["colocalization", "pp4", "methylation-chain"],
  },
  {
    slug: "single-cell-eqtl",
    term: "Single-cell eQTL",
    short:
      "An eQTL measured within one cell type, from single-cell RNA data, rather than averaged over a whole tissue.",
    long:
      "Single-cell RNA sequencing assigns each measured cell to a type before testing variants against expression, producing per-cell-type eQTLs. This recovers effects confined to one population, such as a variant active only in excitatory neurons, that bulk tissue averages away. The dataset used here covers eight brain cell types from 192 donors; its modest sample size limits power, and it added six loci beyond the bulk channels.",
    seeAlso: ["bulk-tissue", "eqtl"],
  },
  {
    slug: "sqtl",
    term: "sQTL (splicing quantitative trait locus)",
    short:
      "A variant associated with how a gene's RNA is spliced, changing the mix of transcript forms rather than the total amount.",
    long:
      "Most human genes produce several transcript forms through alternative splicing. A splicing QTL shifts the balance between forms, sometimes without changing the gene's total expression, so an eQTL analysis can miss it entirely. Seventeen splicing datasets were tested here, adding nine loci not explained by any expression channel.",
    seeAlso: ["eqtl", "expression"],
  },
  {
    slug: "summary-statistics",
    term: "Summary statistics",
    short:
      "The per-variant results table of a study: effect size, standard error, p-value, allele frequencies. Everything here uses only these public tables.",
    long:
      "Summary statistics are the published per-variant results of an association study: effect size, standard error, p-value, and allele frequencies, with no individual genotypes attached. Modern methods can run colocalization and fine-mapping from these tables alone, given a public LD reference. Every analysis in this project, and every number on this site, derives from publicly released summary statistics; no controlled-access data were used.",
    seeAlso: ["gwas", "ld"],
  },
  {
    slug: "susie",
    term: "SuSiE",
    short:
      "The Sum of Single Effects fine-mapping model. It splits a region into independent signals and gives each one its own credible set.",
    long:
      "SuSiE models an associated region as a sum of single-variant effects, which lets it separate up to ten independent signals here and produce one credible set per signal. This project ran SuSiE on the GWAS summary statistics with a 1000 Genomes LD reference, then paired each GWAS signal with published per-gene SuSiE results from the eQTL Catalogue. That pairing is the multi-signal rescue channel, the waterfall's second bar; separating signals reclassified about a quarter of single-variant colocalization calls in each direction.",
    seeAlso: ["fine-mapping", "credible-set"],
  },
  {
    slug: "tss",
    term: "TSS (transcription start site)",
    short:
      "The position where a gene's transcription begins. CpG-to-TSS distance is a plausibility check for chained nominations.",
    long:
      "The transcription start site anchors a gene's promoter. Regulatory contacts tend to weaken with distance, so a chained nomination whose CpG lies within a few kilobases of the gene's TSS is mechanistically easier to believe than one half a megabase away. The nominations table reports this distance and offers a 100 kb filter.",
    seeAlso: ["methylation-chain", "cpg"],
  },
  {
    slug: "variant",
    term: "Variant (SNP)",
    short:
      "A position in the genome where the DNA letter differs between people. The common single-letter kind is a SNP.",
    long:
      "A genetic variant is any place the genome differs between individuals; the variants tested in GWAS are almost all single-nucleotide polymorphisms, single-letter differences carried by some fraction of the population. Variants are named by rs identifiers, such as rs4702. The risk variants studied here are common and individually of small effect; none is deterministic for schizophrenia.",
    seeAlso: ["gwas", "index-variant"],
  },
];

export const glossaryBySlug = new Map(GLOSSARY.map((g) => [g.slug, g]));
