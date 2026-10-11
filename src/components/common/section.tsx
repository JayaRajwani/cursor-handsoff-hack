import { cn } from "@/lib/utils";

/** Standard page section with consistent spacing and an optional heading. */
export function Section({
  id,
  eyebrow,
  title,
  description,
  children,
  className,
  muted,
  align = "left",
}: {
  id?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  muted?: boolean;
  align?: "left" | "center";
}) {
  const headingId = id ? `${id}-heading` : undefined;
  return (
    <section id={id} aria-labelledby={title ? headingId : undefined} className={cn("py-16 sm:py-20", muted && "bg-muted", className)}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {title ? (
          <div className={cn("mb-10 max-w-3xl", align === "center" && "mx-auto text-center")}>
            {eyebrow ? <p className="mb-2 text-sm font-semibold tracking-wide text-teal uppercase">{eyebrow}</p> : null}
            <h2 id={headingId} className="text-3xl font-semibold sm:text-4xl">
              {title}
            </h2>
            {description ? <p className="mt-4 text-lg text-muted-foreground">{description}</p> : null}
          </div>
        ) : null}
        {children}
      </div>
    </section>
  );
}
