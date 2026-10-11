import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { mainNav } from "@/config/site";
import { AuthNav } from "./auth-nav";
import { MobileNav } from "./mobile-nav";
import { NavLink } from "./nav-link";

/**
 * Site header. It is a Server Component (so pages stay static and fast);
 * only the login buttons (AuthNav) and the mobile menu run in the browser.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to main content
      </a>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />
        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {mainNav.map((item) => (
              <li key={item.href}>
                <NavLink href={item.href}>{item.title}</NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex sm:items-center sm:gap-2">
            <AuthNav />
          </div>
          <MobileNav />
        </div>
      </div>
      <noscript>
        <div className="border-t bg-muted px-4 py-2 text-center text-sm">
          <Link href="/login" className="underline">
            Log in
          </Link>
        </div>
      </noscript>
    </header>
  );
}
