/** Loader for legal pages written in /content/legal/<slug>.mdx */
import "server-only";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const LEGAL_DIR = path.join(process.cwd(), "content", "legal");

export type LegalPage = { slug: string; title: string; description: string; updated: string; content: string };

export function getLegalSlugs(): string[] {
  if (!fs.existsSync(LEGAL_DIR)) return [];
  return fs
    .readdirSync(LEGAL_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));
}

export function getLegalPage(slug: string): LegalPage | null {
  if (slug !== path.basename(slug)) return null;
  const file = path.join(LEGAL_DIR, `${slug}.mdx`);
  if (!fs.existsSync(file)) return null;
  const { data, content } = matter(fs.readFileSync(file, "utf8"));
  return {
    slug,
    title: String(data.title ?? slug),
    description: String(data.description ?? ""),
    updated: String(data.updated ?? ""),
    content,
  };
}
