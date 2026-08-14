import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Missing Regulation Explorer",
  description:
    "Interactive explorer for the variant-to-gene gap in schizophrenia GWAS: colocalization across expression, splicing, and methylation QTLs at 281 PGC3 loci.",
};

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/nominations/", label: "Gene nominations" },
  { href: "/regional/", label: "Regional plots" },
  { href: "/about/", label: "About" },
];

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-50 text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100">
        <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
            <Link href="/" className="text-sm font-semibold tracking-tight">
              Missing Regulation{" "}
              <span className="font-normal text-zinc-500 dark:text-zinc-400">
                in schizophrenia
              </span>
            </Link>
            <nav className="flex gap-4 text-sm text-zinc-600 dark:text-zinc-300">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="hover:text-zinc-900 dark:hover:text-white"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
            <a
              href="https://github.com/Beyond-InFinnity/fine-mapping-and-missing-regulation"
              className="ml-auto text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub ↗
            </a>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 py-8 text-xs text-zinc-500">
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
