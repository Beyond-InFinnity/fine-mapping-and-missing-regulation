"use client";

import { useState } from "react";
import Explainer, {
  ExplainerSection,
  Takeaways,
} from "@/components/Explainer";
import Term from "@/components/Term";
import RegionalPlot from "@/components/RegionalPlot";

const EXEMPLARS = [
  {
    id: "furin",
    tab: "FURIN (positive control)",
    src: "/data/regional_furin.json",
    blurb:
      "The benchmark schizophrenia variant-to-gene case. The GWAS signal at rs4702 and the FURIN eQTL in MetaBrain cortex share the same lead variant and LD structure; coloc assigns PP4 = 1.00.",
  },
  {
    id: "demotion",
    tab: "rs9607782 (demotion)",
    src: "/data/regional_demotion.json",
    blurb:
      "A cautionary case. Under the single-causal-variant assumption the GWAS and the ENSG00000232710 eQTL colocalize at PP4 = 0.97, but fine-mapping resolves two signals roughly 30 kb apart (PP3 = 0.98). Around a quarter of single-variant colocalization calls change in one direction or the other when signals are separated.",
  },
  {
    id: "chain",
    tab: "rs6010045 (methylation chain)",
    src: "/data/regional_chain.json",
    blurb:
      "A transitive nomination. No expression dataset colocalizes directly with this locus, but the cg08719749 methylation signal shares the secondary GWAS signal near 49.9 Mb (LD is colored with respect to rs4075330, the peak of that shared signal), and the same meQTL colocalizes with ZBED4 expression. The chain nominates ZBED4 where the direct test had favored distinct variants.",
  },
];

export default function RegionalPage() {
  const [tab, setTab] = useState("furin");
  const ex = EXEMPLARS.find((e) => e.id === tab)!;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl">Regional association plots</h1>
        <p className="mt-1 max-w-3xl text-sm text-[var(--ink-dim)]">
          Three exemplar loci, one per major result. Hover any point for
          position, p-value, and <Term k="ld">LD</Term> to the lead variant;
          toggle tracks with the checkboxes.
        </p>
        <Explainer title="How to read a regional plot">
          <ExplainerSection label="What this data is">
            Every tested <Term k="variant">variant</Term> in a window around
            one locus. Position runs along the x axis; association strength
            (larger means a smaller p-value) runs up the y axis. The top
            track is the schizophrenia GWAS; the tracks below it are
            molecular QTL datasets over the same window, with gene positions
            along the bottom.
          </ExplainerSection>
          <ExplainerSection label="How to read it">
            Points are colored by <Term k="ld">LD</Term> with the lead
            variant, from red (near-perfect correlation) down through the
            legend&rsquo;s bins; the lavender diamond is the lead variant
            itself, and gray points are uncorrelated or absent from the LD
            panel. <Term k="colocalization">Colocalization</Term> appears as
            matching skylines: the same colored points rise to a peak in two
            tracks. Two signals side by side in different colors are the
            visual signature of distinct causal variants.
          </ExplainerSection>
          <ExplainerSection label="What to take away, and what not to">
            <Takeaways
              yes={[
                <>
                  FURIN shows what true sharing looks like; the rs9607782
                  case shows how a single-variant test can be fooled when a
                  locus carries two signals; the rs6010045 case shows a
                  methylation chain nominating a gene without direct
                  expression evidence.
                </>,
              ]}
              no={[
                <>
                  Visual similarity is suggestive only. The numbers elsewhere
                  on this site come from the formal colocalization test, not
                  from eyeballing skylines.
                </>,
              ]}
            />
          </ExplainerSection>
        </Explainer>
      </div>
      <div className="flex flex-wrap gap-2">
        {EXEMPLARS.map((e) => (
          <button
            key={e.id}
            onClick={() => setTab(e.id)}
            className={`rounded-full border px-3 py-1 text-sm ${
              tab === e.id
                ? "border-[var(--gold)] bg-[var(--gold)] text-[#0a0e17] font-medium"
                : "border-[var(--line)] bg-[var(--panel)] text-[var(--ink-dim)] hover:border-[var(--gold)]"
            }`}
          >
            {e.tab}
          </button>
        ))}
      </div>
      <p className="max-w-3xl text-sm text-[var(--ink-dim)]">
        {ex.blurb}
      </p>
      <div className="panel p-5">
        <RegionalPlot src={ex.src} key={ex.id} />
      </div>
    </div>
  );
}
