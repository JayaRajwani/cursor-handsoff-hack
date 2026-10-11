import Link from "next/link";
import { CalendarCheck, Presentation, Users } from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { siteConfig } from "@/config/site";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Book a live session or training call",
  description: "Book a live AI training session, a one-to-one consultation or an institutional training discovery call with our team.",
  path: "/book",
});

const options = [
  { icon: Presentation, title: "Live group sessions", text: "Interactive online workshops for departments and teams." },
  { icon: Users, title: "Institutional training", text: "Discuss a training programme for your hospital or clinic." },
  { icon: CalendarCheck, title: "One-to-one consultation", text: "Personal guidance on using AI in your role." },
];

export default function BookPage() {
  const embedUrl = `${siteConfig.calLink}${siteConfig.calLink.includes("?") ? "&" : "?"}embed=true&theme=light`;
  return (
    <>
      <PageHeader title="Book a session" description="Choose a time that suits you. You will receive a calendar invitation and a video link." breadcrumbs={[{ name: "Book a session", href: "/book" }]} />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <ul className="grid gap-4 md:grid-cols-3">
          {options.map((o) => (
            <li key={o.title} className="rounded-xl border bg-card p-5">
              <o.icon className="size-6 text-teal" aria-hidden="true" />
              <h2 className="mt-3 text-lg font-semibold">{o.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{o.text}</p>
            </li>
          ))}
        </ul>
        <div className="mt-8 overflow-hidden rounded-xl border bg-card shadow-sm">
          <iframe src={embedUrl} title="Booking calendar" className="h-[720px] w-full" loading="lazy" />
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Calendar not loading?{" "}
          <a href={siteConfig.calLink} target="_blank" rel="noopener noreferrer" className="text-teal underline">
            Open the booking page in a new tab
          </a>{" "}
          or{" "}
          <Link href="/contact" className="text-teal underline">
            contact us
          </Link>
          .
        </p>
      </div>
    </>
  );
}
