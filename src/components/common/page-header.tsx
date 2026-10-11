import { NetworkPattern } from "@/components/illustrations/patterns";
import { Breadcrumbs, type Crumb } from "./breadcrumbs";

/** Navy banner used at the top of inner pages. */
export function PageHeader({
  title,
  description,
  breadcrumbs,
  eyebrow,
  children,
}: {
  title: string;
  description?: string;
  breadcrumbs?: Crumb[];
  eyebrow?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden bg-primary text-white">
      <NetworkPattern className="text-teal-soft" />
      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        {breadcrumbs ? <Breadcrumbs items={breadcrumbs} inverted className="mb-6" /> : null}
        {eyebrow ? <p className="mb-3 text-sm font-semibold tracking-wide text-teal-soft uppercase">{eyebrow}</p> : null}
        <h1 className="max-w-3xl text-3xl font-semibold text-white sm:text-4xl lg:text-5xl">{title}</h1>
        {description ? <p className="mt-4 max-w-2xl text-lg text-white/85">{description}</p> : null}
        {children}
      </div>
    </section>
  );
}
