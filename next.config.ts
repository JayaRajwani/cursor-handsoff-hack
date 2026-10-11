import type { NextConfig } from "next";

/**
 * Next.js configuration.
 * Docs: https://nextjs.org/docs/app/api-reference/config/next-config-js
 */
const nextConfig: NextConfig = {
  // Allow next/image to load free-license photos from Unsplash.
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },

  // Lessons and blog posts are MDX files read from /content at request time.
  // This makes sure Vercel bundles those files with the server functions.
  outputFileTracingIncludes: {
    "/**": ["./content/**/*"],
  },

  experimental: {
    // Payment screenshots are uploaded through a Server Action.
    // Vercel's free plan accepts request bodies up to ~4.5 MB.
    serverActions: { bodySizeLimit: "4mb" },
  },

  // Tailwind CSS v4 is processed by its Turbopack loader.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },

  // Basic security headers for every page.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
