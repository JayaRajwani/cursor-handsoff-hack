import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { PostList } from "@/components/blog/post-list";
import { PageHeader } from "@/components/common/page-header";
import { getAllPosts, getCategories, toPostMeta } from "@/lib/content/blog";
import { createMetadata } from "@/lib/seo";

type Props = { params: Promise<{ category: string }> };

export function generateStaticParams() {
  return getCategories().map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const match = getCategories().find((c) => c.slug === category);
  if (!match) return {};
  return createMetadata({
    title: `${match.name} — AI in healthcare articles`,
    description: `Articles in the "${match.name}" category: practical advice on using AI tools safely in healthcare.`,
    path: `/blog/category/${match.slug}`,
  });
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  const match = getCategories().find((c) => c.slug === category);
  if (!match) notFound();
  const posts = getAllPosts().filter((p) => p.categorySlug === category);
  return (
    <>
      <PageHeader
        eyebrow="Category"
        title={match.name}
        breadcrumbs={[
          { name: "Blog", href: "/blog" },
          { name: match.name, href: `/blog/category/${match.slug}` },
        ]}
      />
      <PostList posts={posts.map(toPostMeta)} activeCategory={category} />
    </>
  );
}
