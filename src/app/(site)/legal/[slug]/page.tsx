import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { PageHeader } from "@/components/common/page-header";
import { MdxContent } from "@/components/mdx/mdx-content";
import { getLegalPage, getLegalSlugs } from "@/lib/content/legal";
import { createMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getLegalSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getLegalPage(slug);
  if (!page) return {};
  return createMetadata({ title: page.title, description: page.description, path: `/legal/${slug}` });
}

export default async function LegalPage({ params }: Props) {
  const { slug } = await params;
  const page = getLegalPage(slug);
  if (!page) notFound();
  return (
    <>
      <PageHeader title={page.title} description={page.updated ? `Last updated ${formatDate(page.updated)}` : undefined} breadcrumbs={[{ name: page.title, href: `/legal/${slug}` }]} />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <MdxContent source={page.content} />
      </div>
    </>
  );
}
