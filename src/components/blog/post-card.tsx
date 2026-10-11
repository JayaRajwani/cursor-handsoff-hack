import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import type { PostMeta } from "@/lib/content/blog";
import { formatDate } from "@/lib/utils";

export function PostCard({ post }: { post: PostMeta }) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow focus-within:ring-2 focus-within:ring-teal hover:shadow-md">
      {post.image ? (
        <div className="relative aspect-[16/9] bg-primary">
          <Image src={post.image} alt="" fill unoptimized sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover" />
        </div>
      ) : null}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <Badge variant="teal">{post.category}</Badge>
        <h3 className="text-xl leading-snug font-semibold">
          <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
            {post.title}
          </Link>
        </h3>
        <p className="line-clamp-3 text-sm text-muted-foreground">{post.description}</p>
        <p className="mt-auto text-xs text-muted-foreground">
          <time dateTime={post.date}>{formatDate(post.date)}</time> · {post.readingMinutes} min read
        </p>
      </div>
    </article>
  );
}
