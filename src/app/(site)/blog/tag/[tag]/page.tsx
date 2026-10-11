import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { PostList } from "@/components/blog/post-list";
import { PageHeader } from "@/components/common/page-header";
import { getAllPosts, getTags, toPostMeta } from "@/lib/content/blog";
import { createMetadata } from "@/lib/seo";
import { slugify } from "@/lib/utils";

type Props = { params: Promise<{ tag: string }> };

export function generateStaticParams() {
  return getTags().map((t) => ({ tag: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params;
  const match = getTags().find((t) => t.slug === tag);
  if (!match) return {};
  return createMetadata({
    title: `Articles tagged "${match.name}"`,
    description: `Healthcare AI articles about ${match.name.toLowerCase()}.`,
    path: `/blog/tag/${match.slug}`,
  });
}

export default async function TagPage({ params }: Props) {
  const { tag } = await params;
  const match = getTags().find((t) => t.slug === tag);
  if (!match) notFound();
  const posts = getAllPosts().filter((p) => p.tags.some((t) => slugify(t) === tag));
  return (
    <>
      <PageHeader
        eyebrow="Tag"
        title={`#${match.name}`}
        breadcrumbs={[
          { name: "Blog", href: "/blog" },
          { name: `#${match.name}`, href: `/blog/tag/${match.slug}` },
        ]}
      />
      <PostList posts={posts.map(toPostMeta)} activeTag={tag} />
    </>
  );
}
