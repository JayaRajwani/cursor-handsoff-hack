import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind class names safely (used by all UI components). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Typography styles for long-form content (lessons, blog posts, legal pages). */
export const proseClass = cn(
  "prose prose-slate max-w-none",
  "prose-headings:font-serif prose-headings:text-primary prose-headings:scroll-mt-24",
  "prose-a:text-teal prose-a:underline-offset-2 hover:prose-a:text-teal-strong",
  "prose-strong:text-foreground prose-blockquote:border-l-teal prose-blockquote:text-muted-foreground",
  "prose-code:before:content-none prose-code:after:content-none prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:font-normal",
  "prose-pre:bg-navy-900 prose-img:rounded-lg prose-th:text-primary",
);

/** Format a date like "12 March 2026". */
export function formatDate(input: string | Date): string {
  const date = typeof input === "string" ? new Date(input) : input;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

/** Turn "Clinical Documentation" into "clinical-documentation". */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Format minutes as "1 h 20 min" / "45 min". */
export function formatMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h && m) return `${h} h ${m} min`;
  if (h) return `${h} h`;
  return `${m} min`;
}

/** Build an absolute URL from a path, using the configured site URL. */
export function absoluteUrl(path = "/"): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
