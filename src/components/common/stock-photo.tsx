"use client";

import { useState } from "react";
import Image from "next/image";

import { NetworkPattern } from "@/components/illustrations/patterns";
import { cn } from "@/lib/utils";

/**
 * A stock photo with a graceful fallback: if the photo cannot be loaded,
 * an on-brand illustrated panel is shown instead, so the layout never breaks.
 */
export function StockPhoto({ src, alt, className, priority }: { src: string; alt: string; className?: string; priority?: boolean }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={cn("relative overflow-hidden rounded-xl bg-primary", className)}>
      {failed ? (
        <div role="img" aria-label={alt} className="absolute inset-0 bg-gradient-to-br from-primary to-teal-strong">
          <NetworkPattern className="text-teal-soft" />
        </div>
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
