import { ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";

/** "Patient privacy" reminder shown on course and lesson pages. */
export function PrivacyCallout({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <aside
      aria-label="Patient privacy reminder"
      className={cn("flex gap-3 rounded-lg border border-teal-soft bg-teal-50 p-4 text-sm text-teal-strong", className)}
    >
      <ShieldCheck className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div>
        <p className="font-semibold">Patient privacy</p>
        <p className={cn("mt-1 text-foreground/80", compact && "text-xs")}>
          Never enter identifiable patient information — names, ID or MR numbers, dates of birth, addresses, photos or
          rare-case details — into AI tools. Use anonymised or invented examples, and follow your institution&apos;s
          data-protection policy.
        </p>
      </div>
    </aside>
  );
}
