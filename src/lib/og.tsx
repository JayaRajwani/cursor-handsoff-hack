/**
 * Shared design for auto-generated social sharing images (Open Graph / Twitter).
 * Rendered by next/og at build time.
 */
import { ImageResponse } from "next/og";

import { siteConfig } from "@/config/site";

export const ogSize = { width: 1200, height: 630 };

export function renderOgImage({ title, eyebrow, subtitle }: { title: string; eyebrow?: string; subtitle?: string }) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "linear-gradient(135deg, #0b2545 0%, #13315c 60%, #115e59 100%)",
          color: "#ffffff",
          fontFamily: "serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <svg width="64" height="64" viewBox="0 0 40 40">
            <rect width="40" height="40" rx="9" fill="#ffffff" />
            <path d="M6 22h6l2.5-6 4 12 3-8h3.5" fill="none" stroke="#0b2545" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="25" cy="20" r="2.2" fill="#0f766e" />
            <circle cx="31" cy="13" r="2" fill="#0f766e" />
            <circle cx="33" cy="22" r="2" fill="#0f766e" />
            <circle cx="29" cy="29" r="1.8" fill="#0f766e" />
          </svg>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 34, fontWeight: 700 }}>{siteConfig.name}</span>
            <span style={{ fontSize: 22, color: "#ccfbf1", fontFamily: "sans-serif" }}>{siteConfig.tagline}</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {eyebrow ? (
            <span style={{ fontSize: 26, color: "#5eead4", textTransform: "uppercase", letterSpacing: 2, fontFamily: "sans-serif" }}>
              {eyebrow}
            </span>
          ) : null}
          <span style={{ fontSize: title.length > 60 ? 54 : 66, fontWeight: 700, lineHeight: 1.1 }}>{title}</span>
          {subtitle ? (
            <span style={{ fontSize: 28, color: "#e2e8f0", fontFamily: "sans-serif", lineHeight: 1.35 }}>
              {subtitle.length > 140 ? `${subtitle.slice(0, 137)}…` : subtitle}
            </span>
          ) : null}
        </div>
        <svg width="1056" height="40" viewBox="0 0 1056 40">
          <path d="M0 20h420l20-16 26 32 20-24 14 8h556" fill="none" stroke="#5eead4" strokeOpacity="0.6" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    ),
    ogSize,
  );
}
