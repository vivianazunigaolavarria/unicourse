import type { ReactNode } from "react";

import type { NavItem } from "@/content/copy/es-mx";
import { Logo } from "@/components/layout/logo";
import { SidebarNav } from "@/components/layout/sidebar-nav";

type AppShellProps = {
  badge: string;
  title: string;
  description: string;
  navItems: NavItem[];
  rightRail?: ReactNode;
  children: ReactNode;
};

export function AppShell({
  badge,
  title,
  description,
  navItems,
  rightRail,
  children,
}: AppShellProps) {
  return (
    <div className="mx-auto grid min-h-screen w-full max-w-7xl gap-5 px-4 py-5 lg:grid-cols-[270px_minmax(0,1fr)]">
      <aside className="uc-surface grid gap-6 self-start rounded-[28px] p-5 lg:sticky lg:top-5">
        <Logo />
        <div className="rounded-[24px] border border-[var(--uc-border)] bg-[linear-gradient(180deg,rgba(107,92,224,0.08),rgba(47,169,143,0.08))] p-5">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--uc-muted)]">{badge}</p>
          <h2 className="mt-3 font-heading text-2xl text-[var(--uc-ink)]">{title}</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--uc-muted)]">{description}</p>
        </div>
        <SidebarNav items={navItems} />
        {rightRail}
      </aside>

      <main className="grid gap-5">{children}</main>
    </div>
  );
}

