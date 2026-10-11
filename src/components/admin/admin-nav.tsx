"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, CreditCard, Gauge, Mail, Newspaper, Users } from "lucide-react";

import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "Overview", icon: Gauge },
  { href: "/admin/enrollments", label: "Enrolments & payments", icon: CreditCard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/messages", label: "Contact messages", icon: Mail },
  { href: "/admin/enquiries", label: "Institution enquiries", icon: Building2 },
  { href: "/admin/subscribers", label: "Newsletter", icon: Newspaper },
];

export function AdminNav({ pendingCount }: { pendingCount: number }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin">
      <ul className="flex gap-1 overflow-x-auto lg:flex-col">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap hover:bg-accent",
                  active ? "bg-teal-50 text-teal-strong" : "text-foreground/80",
                )}
              >
                <item.icon className="size-4" aria-hidden="true" />
                {item.label}
                {item.href === "/admin/enrollments" && pendingCount > 0 ? (
                  <span className="ml-auto rounded-full bg-warning px-1.5 text-xs text-white">{pendingCount}</span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
