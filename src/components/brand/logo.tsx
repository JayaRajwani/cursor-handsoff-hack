import Link from "next/link";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

/**
 * The MedAI Academy logo mark: a heartbeat line flowing into a small
 * network of connected nodes (medicine + AI), inside a rounded shield.
 */
export function LogoMark({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("size-9", className)} aria-hidden="true" focusable="false">
      <rect width="40" height="40" rx="9" fill={inverted ? "#ffffff" : "#0b2545"} />
      <path
        d="M6 22h6l2.5-6 4 12 3-8h3.5"
        fill="none"
        stroke={inverted ? "#0b2545" : "#ffffff"}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <g stroke="#2dd4bf" strokeWidth="1.6" strokeLinecap="round">
        <line x1="25" y1="20" x2="31" y2="13" />
        <line x1="25" y1="20" x2="33" y2="22" />
        <line x1="31" y1="13" x2="33" y2="22" />
        <line x1="33" y1="22" x2="29" y2="29" />
      </g>
      <g fill="#2dd4bf">
        <circle cx="25" cy="20" r="2.2" />
        <circle cx="31" cy="13" r="2" />
        <circle cx="33" cy="22" r="2" />
        <circle cx="29" cy="29" r="1.8" />
      </g>
    </svg>
  );
}

/** Logo mark + brand name, linking to the home page. */
export function Logo({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <Link
      href="/"
      className={cn("inline-flex items-center gap-2.5 rounded-md", className)}
      aria-label={`${siteConfig.name} — home`}
    >
      <LogoMark inverted={inverted} />
      <span className="flex flex-col leading-none">
        <span className={cn("font-serif text-lg font-semibold tracking-tight", inverted ? "text-white" : "text-primary")}>
          {siteConfig.name}
        </span>
        <span className={cn("mt-1 hidden text-[11px] font-medium sm:block", inverted ? "text-white/80" : "text-muted-foreground")}>
          {siteConfig.tagline}
        </span>
      </span>
    </Link>
  );
}
