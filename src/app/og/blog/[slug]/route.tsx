/**
 * Social sharing image for a blog post, at a stable URL: /og/blog/<slug>
 * Pre-built at deploy time (static).
 */
import { getAllPosts, getPost } from "@/lib/content/blog";
import { renderOgImage } from "@/lib/og";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  return renderOgImage({ eyebrow: post?.category ?? "Blog", title: post?.title ?? "Blog", subtitle: post?.description });
}
