import { cn } from "@/lib/utils";

/** Faint neural-network dot pattern used as a decorative section background. */
export function NetworkPattern({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" focusable="false" className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}>
      <defs>
        <pattern id="network-pattern" width="120" height="120" patternUnits="userSpaceOnUse">
          <g stroke="currentColor" strokeOpacity="0.18" strokeWidth="1">
            <line x1="20" y1="20" x2="70" y2="45" />
            <line x1="70" y1="45" x2="100" y2="95" />
            <line x1="70" y1="45" x2="35" y2="90" />
            <line x1="35" y1="90" x2="100" y2="95" />
          </g>
          <g fill="currentColor" fillOpacity="0.28">
            <circle cx="20" cy="20" r="2.5" />
            <circle cx="70" cy="45" r="3" />
            <circle cx="100" cy="95" r="2.5" />
            <circle cx="35" cy="90" r="2" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#network-pattern)" />
    </svg>
  );
}

/** A thin heartbeat line used as a section divider accent. */
export function HeartbeatLine({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 24" aria-hidden="true" focusable="false" className={cn("h-6 w-40", className)}>
      <path
        d="M0 12h80l8-9 10 18 8-14 6 5h128"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
