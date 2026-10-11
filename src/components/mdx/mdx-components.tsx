/**
 * Custom components you can use inside lesson and blog MDX files:
 *
 *   <Callout type="tip|note|warning|privacy" title="...">Markdown text</Callout>
 *   <Prompt title="...">Example prompt text</Prompt>
 *   <Exercise title="...">Instructions</Exercise>
 *   <KeyTakeaways>- bullet list</KeyTakeaways>
 *   <Video src="https://www.youtube-nocookie.com/embed/VIDEO_ID" title="..." />
 *
 * Leave a blank line after the opening tag and before the closing tag so the
 * Markdown inside is formatted correctly.
 */
import Link from "next/link";
import { AlertTriangle, ClipboardList, Info, Lightbulb, ListChecks, ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";
import { Prompt } from "./prompt";

const calloutStyles = {
  tip: { icon: Lightbulb, className: "border-teal-soft bg-teal-50", iconClass: "text-teal", label: "Tip" },
  note: { icon: Info, className: "border-navy-100 bg-navy-50", iconClass: "text-primary", label: "Note" },
  warning: { icon: AlertTriangle, className: "border-warning/30 bg-warning-soft", iconClass: "text-warning", label: "Warning" },
  privacy: { icon: ShieldCheck, className: "border-teal-soft bg-teal-50", iconClass: "text-teal-strong", label: "Patient privacy" },
} as const;

export function Callout({
  type = "note",
  title,
  children,
}: {
  type?: keyof typeof calloutStyles;
  title?: string;
  children: React.ReactNode;
}) {
  const style = calloutStyles[type] ?? calloutStyles.note;
  const Icon = style.icon;
  return (
    <aside className={cn("not-prose my-6 flex gap-3 rounded-lg border p-4", style.className)} aria-label={title ?? style.label}>
      <Icon className={cn("mt-0.5 size-5 shrink-0", style.iconClass)} aria-hidden="true" />
      <div className="min-w-0 text-[15px] leading-relaxed text-foreground [&_a]:text-teal [&_a]:underline [&_p]:my-1 [&_strong]:text-foreground">
        <p className="font-semibold text-primary">{title ?? style.label}</p>
        {children}
      </div>
    </aside>
  );
}

export function Exercise({ title = "Exercise", children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="not-prose my-8 rounded-lg border-2 border-dashed border-teal/40 bg-white p-5" aria-label={`Exercise: ${title}`}>
      <p className="mb-2 flex items-center gap-2 font-serif text-lg font-semibold text-primary">
        <ClipboardList className="size-5 text-teal" aria-hidden="true" />
        Exercise: {title}
      </p>
      <div className="text-[15px] leading-relaxed text-foreground [&_p]:my-2">{children}</div>
    </section>
  );
}

export function KeyTakeaways({ children }: { children: React.ReactNode }) {
  return (
    <section className="not-prose my-8 rounded-lg bg-primary p-5 text-white" aria-label="Key takeaways">
      <p className="mb-2 flex items-center gap-2 font-serif text-lg font-semibold text-white">
        <ListChecks className="size-5 text-teal-soft" aria-hidden="true" />
        Key takeaways
      </p>
      <div className="text-[15px] leading-relaxed text-white/90 [&_li]:my-1 [&_ul]:list-disc [&_ul]:pl-5">{children}</div>
    </section>
  );
}

/** Responsive, privacy-friendly video embed (YouTube-nocookie or Vimeo). */
export function Video({ src, title = "Lesson video" }: { src: string; title?: string }) {
  return (
    <div className="not-prose my-6 aspect-video overflow-hidden rounded-lg border bg-navy-900">
      <iframe
        src={src}
        title={title}
        className="h-full w-full"
        loading="lazy"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
  );
}

/** Internal links use Next.js <Link>; external links open safely in a new tab. */
function Anchor({ href = "", children, ...props }: React.ComponentProps<"a">) {
  if (href.startsWith("/") || href.startsWith("#")) {
    return (
      <Link href={href} {...props}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

/** Markdown images: lazy-loaded, with the alt text shown as a caption. */
function Img({ src, alt = "" }: React.ComponentProps<"img">) {
  return (
    <figure className="my-6">
      {/* eslint-disable-next-line @next/next/no-img-element -- MDX images have unknown sizes */}
      <img src={typeof src === "string" ? src : undefined} alt={alt} loading="lazy" className="w-full rounded-lg border" />
      {alt ? <figcaption className="mt-2 text-center text-sm text-muted-foreground">{alt}</figcaption> : null}
    </figure>
  );
}

function Table(props: React.ComponentProps<"table">) {
  return (
    <div className="my-6 overflow-x-auto">
      <table {...props} />
    </div>
  );
}

export const mdxComponents = {
  Callout,
  Prompt,
  Exercise,
  KeyTakeaways,
  Video,
  a: Anchor,
  img: Img,
  table: Table,
};
