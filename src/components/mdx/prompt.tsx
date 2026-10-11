"use client";

import { useRef, useState } from "react";
import { Check, Copy, MessageSquareText } from "lucide-react";

/** An example prompt box with a "Copy prompt" button. Used in MDX as <Prompt title="...">. */
export function Prompt({ title = "Example prompt", children }: { title?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!ref.current) return;
    try {
      await navigator.clipboard.writeText(ref.current.innerText.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be blocked by the browser; fail silently.
    }
  }

  return (
    <figure className="not-prose my-6 overflow-hidden rounded-lg border border-navy-100 bg-white shadow-sm">
      <figcaption className="flex items-center justify-between gap-2 border-b border-navy-100 bg-navy-50 px-4 py-2">
        <span className="flex items-center gap-2 text-sm font-semibold text-primary">
          <MessageSquareText className="size-4 text-teal" aria-hidden="true" />
          {title}
        </span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-teal-strong hover:bg-teal-soft"
        >
          {copied ? <Check className="size-3.5" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
          <span aria-live="polite">{copied ? "Copied" : "Copy prompt"}</span>
        </button>
      </figcaption>
      <div ref={ref} className="space-y-3 px-4 py-3 font-mono text-[13.5px] leading-relaxed text-foreground [&_p]:m-0">
        {children}
      </div>
    </figure>
  );
}
