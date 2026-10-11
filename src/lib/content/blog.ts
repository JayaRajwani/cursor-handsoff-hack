/**
 * Blog content loader.
 *
 * Blog posts live in /content/blog/<post-slug>.mdx with frontmatter:
 *   title, description, date (YYYY-MM-DD), author, category, tags, image (optional)
 */
import "server-only";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";
import { cache } from "react";

import { slugify } from "@/lib/utils";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

const postSchema = z.object({
  title: z.string(),
  description: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use the format YYYY-MM-DD"),
  updated: z.string().optional(),
  author: z.string(),
  category: z.string(),
  tags: z.array(z.string()).default([]),
  image: z.string().optional(),
  draft: z.boolean().default(false),
});

export type PostMeta = z.infer<typeof postSchema> & {
  slug: string;
  categorySlug: string;
  readingMinutes: number;
};

export type Post = PostMeta & { content: string };

function loadPost(file: string): Post {
  const filePath = path.join(BLOG_DIR, file);
  const { data, content } = matter(fs.readFileSync(filePath, "utf8"));
  const parsed = postSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(`Invalid frontmatter in ${filePath}: ${parsed.error.message}`);
  }
  const words = content.split(/\s+/).filter(Boolean).length;
  return {
    ...parsed.data,
    slug: file.replace(/\.mdx$/, ""),
    categorySlug: slugify(parsed.data.category),
    readingMinutes: Math.max(1, Math.round(words / 220)),
    content,
  };
}

/** All published posts, newest first. */
export const getAllPosts = cache((): Post[] => {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((file) => file.endsWith(".mdx"))
    .map(loadPost)
    .filter((post) => !post.draft)
    .sort((a, b) => b.date.localeCompare(a.date));
});

export const getPost = cache((slug: string): Post | null => {
  return getAllPosts().find((post) => post.slug === slug) ?? null;
});

/** Strip the body so lists only send what they need. */
export function toPostMeta(post: Post): PostMeta {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { content, ...meta } = post;
  return meta;
}

export function getCategories(): { name: string; slug: string; count: number }[] {
  const map = new Map<string, { name: string; slug: string; count: number }>();
  for (const post of getAllPosts()) {
    const existing = map.get(post.categorySlug);
    if (existing) existing.count += 1;
    else map.set(post.categorySlug, { name: post.category, slug: post.categorySlug, count: 1 });
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function getTags(): { name: string; slug: string; count: number }[] {
  const map = new Map<string, { name: string; slug: string; count: number }>();
  for (const post of getAllPosts()) {
    for (const tag of post.tags) {
      const slug = slugify(tag);
      const existing = map.get(slug);
      if (existing) existing.count += 1;
      else map.set(slug, { name: tag, slug, count: 1 });
    }
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}
