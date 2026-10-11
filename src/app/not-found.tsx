import Link from "next/link";
import type { Metadata } from "next";
import { Search } from "lucide-react";

import { HeartbeatLine } from "@/components/illustrations/patterns";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

/** Custom 404 page. */
export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="flex flex-1 items-center">
        <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
          <p className="font-serif text-7xl font-semibold text-teal">404</p>
          <HeartbeatLine className="mx-auto mt-4 w-56 text-primary/40" />
          <h1 className="mt-6 text-3xl font-semibold sm:text-4xl">We couldn&apos;t find that page</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            The page may have moved, or the link may be incorrect. Try one of these instead:
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/">Go to the home page</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/courses">
                <Search aria-hidden="true" />
                Browse courses
              </Link>
            </Button>
          </div>
          <p className="mt-8 text-sm text-muted-foreground">
            Need help?{" "}
            <Link href="/contact" className="text-teal underline">
              Contact us
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
