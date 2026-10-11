import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

import { proseClass, cn } from "@/lib/utils";
import { mdxComponents } from "./mdx-components";

/** Renders an MDX string (lesson, blog post) on the server. */
export function MdxContent({ source, className }: { source: string; className?: string }) {
  return (
    <div className={cn(proseClass, className)}>
      <MDXRemote
        source={source}
        components={mdxComponents}
        options={{
          mdxOptions: { remarkPlugins: [remarkGfm], rehypePlugins: [rehypeSlug] },
        }}
      />
    </div>
  );
}
