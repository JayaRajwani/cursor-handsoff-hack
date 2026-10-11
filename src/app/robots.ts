import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

/** Generates /robots.txt */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/admin", "/enroll", "/api/", "/auth/", "/reset-password"],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
