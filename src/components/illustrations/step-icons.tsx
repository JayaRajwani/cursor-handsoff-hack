/**
 * Small custom icons for the "How it works" steps.
 * Each one is an original SVG drawn for this site.
 */
type IconProps = { className?: string };

const base = {
  viewBox: "0 0 48 48",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false,
};

export function BrowseIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="6" y="8" width="28" height="32" rx="4" />
      <path d="M12 16h16M12 22h12M12 28h8" />
      <circle cx="34" cy="32" r="7" />
      <path d="M39 37l4 4" />
    </svg>
  );
}

export function EnrollIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="8" y="6" width="32" height="38" rx="4" />
      <rect x="17" y="2" width="14" height="8" rx="2" />
      <path d="M16 26l6 6 10-12" />
    </svg>
  );
}

export function LearnIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="4" y="8" width="40" height="26" rx="3" />
      <path d="M10 22h7l3-6 4 12 3-6h11" />
      <path d="M18 42h12M24 34v8" />
    </svg>
  );
}

export function CertifiedIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="24" cy="19" r="11" />
      <path d="M19 19l4 4 6-7" />
      <path d="M17 28l-4 14 11-5 11 5-4-14" />
    </svg>
  );
}
