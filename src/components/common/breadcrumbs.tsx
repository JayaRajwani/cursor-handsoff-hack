import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd } from "@/lib/seo";
import { cn } from "@/lib/utils";

export type Crumb = { name: string; href: string };

/** Visible breadcrumb trail + matching BreadcrumbList structured data. */
export function Breadcrumbs({ items, className, inverted }: { items: Crumb[]; className?: string; inverted?: boolean }) {
  const all = [{ name: "Home", href: "/" }, ...items];
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(all)} />
      <nav aria-label="Breadcrumb" className={cn("text-sm", className)}>
        <ol className="flex flex-wrap items-center gap-1">
          {all.map((item, index) => {
            const last = index === all.length - 1;
            return (
              <li key={item.href} className="flex items-center gap-1">
                {index > 0 ? (
                  <ChevronRight aria-hidden="true" className={cn("size-3.5", inverted ? "text-white/60" : "text-muted-foreground")} />
                ) : null}
                {last ? (
                  <span aria-current="page" className={cn("font-medium", inverted ? "text-white" : "text-foreground")}>
                    {item.name}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className={cn("hover:underline", inverted ? "text-white/80 hover:text-white" : "text-muted-foreground hover:text-teal")}
                  >
                    {item.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
