"use client";

import { useState } from "react";
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
          position, p-value, and LD to the lead variant; toggle tracks with
          the checkboxes.
        </p>
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
