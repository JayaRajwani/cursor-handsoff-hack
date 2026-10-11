import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";
import { getAllPosts, getCategories, getTags } from "@/lib/content/blog";
import { getAllCourses, getCourseLessons } from "@/lib/content/courses";
import { getLegalSlugs } from "@/lib/content/legal";

/** Generates /sitemap.xml automatically from courses, blog posts and pages. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url;
  const now = new Date();

  const staticPages = ["", "/courses", "/blog", "/about", "/faq", "/contact", "/book", "/institutions", "/verify", "/login", "/signup"].map(
    (path) => ({
      url: `${base}${path}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.7,
    }),
  );

  const courses = getAllCourses();
  const coursePages = courses.map((course) => ({
    url: `${base}/courses/${course.slug}`,
    lastModified: course.lastUpdated ? new Date(course.lastUpdated) : now,
    changeFrequency: "monthly" as const,
    priority: course.published ? 0.9 : 0.5,
  }));

  // Free preview lessons are public, so they can be indexed.
  const previewLessons = courses
    .filter((c) => c.published)
    .flatMap((course) =>
      getCourseLessons(course)
        .filter((l) => l.freePreview)
        .map((lesson) => ({
          url: `${base}/learn/${course.slug}/${lesson.slug}`,
          lastModified: now,
          changeFrequency: "monthly" as const,
          priority: 0.6,
        })),
    );

  const posts = getAllPosts().map((post) => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: new Date(post.updated ?? post.date),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const taxonomy = [
    ...getCategories().map((c) => `${base}/blog/category/${c.slug}`),
    ...getTags().map((t) => `${base}/blog/tag/${t.slug}`),
  ].map((url) => ({ url, lastModified: now, changeFrequency: "weekly" as const, priority: 0.4 }));

  const legal = getLegalSlugs().map((slug) => ({
    url: `${base}/legal/${slug}`,
    lastModified: now,
    changeFrequency: "yearly" as const,
    priority: 0.2,
  }));

  return [...staticPages, ...coursePages, ...previewLessons, ...posts, ...taxonomy, ...legal];
}
