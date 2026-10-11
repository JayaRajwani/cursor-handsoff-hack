/**
 * SEO helpers: build page metadata (title, description, canonical URL,
 * Open Graph + Twitter cards) and JSON-LD structured data.
 */
import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import type { Course } from "@/lib/content/courses";
import type { PostMeta } from "@/lib/content/blog";
import { absoluteUrl } from "@/lib/utils";

type MetaArgs = {
  title: string;
  description: string;
  /** Path of the page, e.g. "/courses" — used for the canonical URL. */
  path: string;
  /** Social image path. Defaults to the site-wide Open Graph image. */
  image?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  /** Set true for private pages (dashboard, admin) so search engines skip them. */
  noIndex?: boolean;
  keywords?: string[];
};

export function createMetadata({
  title,
  description,
  path,
  image,
  type = "website",
  publishedTime,
  modifiedTime,
  noIndex,
  keywords,
}: MetaArgs): Metadata {
  // Pages without their own image use the site-wide image from src/app/opengraph-image.tsx
  const images = [{ url: image ?? "/opengraph-image", width: 1200, height: 630, alt: title }];
  return {
    title,
    description,
    keywords,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      siteName: siteConfig.name,
      locale: "en_GB",
      type,
      images,
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: images.map((i) => i.url),
    },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}

/* ----------------------------- JSON-LD ----------------------------- */

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    logo: absoluteUrl("/logo.svg"),
    email: siteConfig.contact.email,
    address: { "@type": "PostalAddress", addressCountry: siteConfig.country },
    sameAs: Object.values(siteConfig.social).filter(Boolean),
  };
}

export function courseJsonLd(course: Course) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.description,
    url: absoluteUrl(`/courses/${course.slug}`),
    image: absoluteUrl(`/og/course/${course.slug}`),
    inLanguage: "en",
    educationalLevel: course.level,
    teaches: course.outcomes,
    keywords: course.keywords.join(", "),
    provider: { "@type": "Organization", name: siteConfig.name, sameAs: siteConfig.url },
    ...(course.published
      ? {
          offers: {
            "@type": "Offer",
            category: course.price.pkr === 0 ? "Free" : "Paid",
            price: course.price.pkr,
            priceCurrency: "PKR",
            availability: "https://schema.org/InStock",
            url: absoluteUrl(`/courses/${course.slug}`),
          },
          hasCourseInstance: {
            "@type": "CourseInstance",
            courseMode: "Online",
            courseWorkload: `PT${Math.max(1, Math.round(course.durationMinutes / 60))}H`,
            instructor: { "@type": "Person", name: siteConfig.instructor.name },
          },
        }
      : {}),
  };
}

export function articleJsonLd(post: PostMeta) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.updated ?? post.date,
    author: { "@type": "Person", name: post.author },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      logo: { "@type": "ImageObject", url: absoluteUrl("/logo.svg") },
    },
    image: absoluteUrl(`/og/blog/${post.slug}`),
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
    articleSection: post.category,
    keywords: post.tags.join(", "),
  };
}

export function faqJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}

export function breadcrumbJsonLd(items: { name: string; href: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.href),
    })),
  };
}
