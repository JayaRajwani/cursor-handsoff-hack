"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { mainNav, siteConfig } from "@/config/site";
import { AuthNav } from "./auth-nav";

/** Slide-out menu for phones and tablets. */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
          <Menu className="size-6" aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader className="border-b">
          <SheetTitle>{siteConfig.name}</SheetTitle>
          <SheetDescription>{siteConfig.tagline}</SheetDescription>
        </SheetHeader>
        <nav aria-label="Mobile" className="px-2">
          <ul className="flex flex-col">
            {[{ title: "Home", href: "/" }, ...mainNav, { title: "Book a session", href: "/book" }].map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={close}
                  className="block rounded-md px-3 py-3 text-base font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-auto border-t p-4">
          <AuthNav onNavigate={close} stacked />
        </div>
      </SheetContent>
    </Sheet>
  );
}
