"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";
import type { NavItem } from "@/content/copy/es-mx";

type SidebarNavProps = {
  items: NavItem[];
};

export function SidebarNav({ items }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="grid gap-2">
      {items.map((item) => {
        const isActive =
          item.match === "startsWith"
            ? pathname === item.href || pathname.startsWith(`${item.href}/`)
            : pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-2xl px-4 py-3 text-sm font-medium transition hover:bg-[rgba(107,92,224,0.08)] hover:text-[var(--uc-violet)]",
              isActive && "bg-[rgba(107,92,224,0.12)] text-[var(--uc-violet)]",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
