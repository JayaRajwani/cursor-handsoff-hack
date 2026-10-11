import Link from "next/link";

import { getCategories, getTags } from "@/lib/content/blog";
import { cn } from "@/lib/utils";

/** Category and tag links shown beside blog lists. */
export function BlogSidebar({ activeCategory, activeTag }: { activeCategory?: string; activeTag?: string }) {
  const categories = getCategories();
  const tags = getTags();
  return (
    <aside className="space-y-8" aria-label="Blog categories and tags">
      <nav aria-labelledby="blog-categories">
        <h2 id="blog-categories" className="font-sans text-sm font-semibold tracking-wide text-primary uppercase">
          Categories
        </h2>
        <ul className="mt-3 space-y-1">
          <li>
            <Link
              href="/blog"
              className={cn("block rounded-md px-2 py-1.5 text-sm hover:bg-accent", !activeCategory && !activeTag && "bg-accent font-medium text-accent-foreground")}
            >
              All articles
            </Link>
          </li>
          {categories.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/blog/category/${c.slug}`}
                aria-current={activeCategory === c.slug ? "page" : undefined}
                className={cn("flex justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent", activeCategory === c.slug && "bg-accent font-medium text-accent-foreground")}
              >
                {c.name}
                <span className="text-muted-foreground">{c.count}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <nav aria-labelledby="blog-tags">
        <h2 id="blog-tags" className="font-sans text-sm font-semibold tracking-wide text-primary uppercase">
          Tags
        </h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {tags.map((t) => (
            <li key={t.slug}>
              <Link
                href={`/blog/tag/${t.slug}`}
                aria-current={activeTag === t.slug ? "page" : undefined}
                className={cn(
                  "inline-block rounded-full border px-3 py-1 text-xs hover:border-teal hover:text-teal",
                  activeTag === t.slug && "border-teal bg-teal-50 text-teal-strong",
                )}
              >
                #{t.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
