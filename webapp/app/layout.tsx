import type { Metadata } from "next";
import Link from "next/link";
import { Playfair_Display, Poppins } from "next/font/google";
import "./globals.css";

const display = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});
const body = Poppins({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Missing Regulation | NERVANALYTICA",
  description:
    "Interactive explorer for the variant-to-gene gap in schizophrenia GWAS: colocalization across expression, splicing, and methylation QTLs at 281 PGC3 loci.",
};

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/guide/", label: "Start here" },
  { href: "/nominations/", label: "Gene nominations" },
  { href: "/regional/", label: "Regional plots" },
  { href: "/glossary/", label: "Glossary" },
  { href: "/about/", label: "About" },
];

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-screen antialiased">
        <header className="border-b border-[var(--line)]">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-2 px-4 py-4">
            <a
              href="https://nerv-analytic.ai"
              className="font-display text-lg tracking-[0.08em]"
            >
              <span className="text-[var(--gold)]">NERV</span>
              <span className="text-[var(--lavender)]">ANALYTICA</span>
            </a>
            <Link
              href="/"
              className="kicker !text-[var(--ink-dim)] hover:!text-[var(--ink)]"
            >
              Missing Regulation
            </Link>
            <nav className="flex gap-5 text-[13px] font-light text-[var(--ink-dim)]">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="hover:text-[var(--gold-bright)]"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
            <a
              href="https://github.com/Beyond-InFinnity/fine-mapping-and-missing-regulation"
              className="ml-auto text-xs text-[var(--muted)] hover:text-[var(--gold)]"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub ↗
            </a>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-6xl border-t border-[var(--line)] px-4 py-8 text-xs font-light leading-5 text-[var(--muted)]">
          Built from public summary statistics (PGC3, GTEx/eQTL Catalogue,
          MetaBrain, Bryois 2022, Walker 2019, Brain-mMeta, Roadmap, 1000
          Genomes). Every number regenerates from the pipeline in the linked
          repository. PP4 refers to the coloc posterior probability of a
          shared causal variant.
        </footer>
      </body>
    </html>
  );
}
