"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Award, LayoutDashboard, Shield, UserRound } from "lucide-react";

import { cn } from "@/lib/utils";

export function DashboardNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const items = [
    { href: "/dashboard", label: "My courses", icon: LayoutDashboard },
    { href: "/dashboard/certificates", label: "Certificates", icon: Award },
    { href: "/dashboard/profile", label: "Profile", icon: UserRound },
    ...(isAdmin ? [{ href: "/admin", label: "Admin panel", icon: Shield }] : []),
  ];
  return (
    <nav aria-label="Dashboard">
      <ul className="flex gap-1 overflow-x-auto lg:flex-col">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors hover:bg-accent",
                  active ? "bg-teal-50 text-teal-strong" : "text-foreground/80",
                )}
              >
                <item.icon className="size-4" aria-hidden="true" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
