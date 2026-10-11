import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { PostCard } from "@/components/blog/post-card";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { MdxContent } from "@/components/mdx/mdx-content";
import { JsonLd } from "@/components/seo/json-ld";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAllPosts, getPost, toPostMeta } from "@/lib/content/blog";
import { articleJsonLd, createMetadata } from "@/lib/seo";
import { formatDate, slugify } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return createMetadata({
    title: post.title,
    description: post.description,
    path: `/blog/${post.slug}`,
    image: `/og/blog/${post.slug}`,
    type: "article",
    publishedTime: post.date,
    modifiedTime: post.updated ?? post.date,
    keywords: post.tags,
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const related = getAllPosts()
    .filter((p) => p.slug !== post.slug)
    .slice(0, 2)
    .map(toPostMeta);

  return (
    <>
      <JsonLd data={articleJsonLd(toPostMeta(post))} />
      <article>
        <header className="border-b bg-navy-50">
          <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
            <Breadcrumbs
              className="mb-6"
              items={[
                { name: "Blog", href: "/blog" },
                { name: post.title, href: `/blog/${post.slug}` },
              ]}
            />
            <Link href={`/blog/category/${post.categorySlug}`}>
              <Badge variant="teal">{post.category}</Badge>
            </Link>
            <h1 className="mt-4 text-3xl leading-tight font-semibold sm:text-4xl">{post.title}</h1>
            <p className="mt-4 text-lg text-muted-foreground">{post.description}</p>
            <p className="mt-4 text-sm text-muted-foreground">
              By {post.author} · <time dateTime={post.date}>{formatDate(post.date)}</time> · {post.readingMinutes} min read
            </p>
          </div>
        </header>
        {post.image ? (
          <div className="mx-auto max-w-4xl px-4 pt-8 sm:px-6">
            <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-primary">
              <Image src={post.image} alt="" fill unoptimized priority sizes="(min-width: 1024px) 896px, 100vw" className="object-cover" />
            </div>
          </div>
        ) : null}
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <MdxContent source={post.content} />
          {post.tags.length ? (
            <ul className="mt-10 flex flex-wrap gap-2 border-t pt-6" aria-label="Tags">
              {post.tags.map((tag) => (
                <li key={tag}>
                  <Link href={`/blog/tag/${slugify(tag)}`} className="inline-block rounded-full border px-3 py-1 text-xs hover:border-teal hover:text-teal">
                    #{tag}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-10 rounded-xl bg-primary p-6 text-white">
            <p className="font-serif text-xl font-semibold text-white">Learn this properly, step by step</p>
            <p className="mt-2 text-sm text-white/85">Practical, safety-first AI courses for healthcare professionals. Free preview lessons available.</p>
            <Button asChild variant="teal" className="mt-4">
              <Link href="/courses">Browse courses</Link>
            </Button>
          </div>
        </div>
      </article>
      {related.length ? (
        <section aria-labelledby="related-heading" className="border-t bg-muted py-12">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <h2 id="related-heading" className="text-2xl font-semibold">
              More articles
            </h2>
            <ul className="mt-6 grid gap-6 sm:grid-cols-2">
              {related.map((p) => (
                <li key={p.slug}>
                  <PostCard post={p} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </>
  );
}
