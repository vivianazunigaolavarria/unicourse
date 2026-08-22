import Link from "next/link";

import { ArrowUpRight } from "lucide-react";

type DashboardHeaderProps = {
  eyebrow?: string;
  title: string;
  description: string;
  firstName: string;
};

function getInitial(firstName: string) {
  return firstName.trim().charAt(0).toUpperCase() || "U";
}

export function DashboardHeader({ eyebrow, title, description, firstName }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="grid gap-2">
        {eyebrow ? <p className="uc-kicker">{eyebrow}</p> : null}
        <h1 className="font-heading text-[clamp(2.4rem,5vw,3.9rem)] leading-[1.02] tracking-[-0.03em] text-[var(--uc-ink)]">{title}</h1>
        <p className="max-w-3xl text-base leading-8 text-[var(--uc-muted)] sm:text-lg">{description}</p>
      </div>

      <Link
        href="/perfil"
        className="inline-flex items-center gap-3 self-start rounded-full border border-[var(--uc-border)] bg-white/78 px-3 py-2 text-[var(--uc-ink)] shadow-[0_12px_30px_rgba(58,37,105,0.08)] no-underline"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,rgba(107,92,224,0.92),rgba(127,223,201,0.8))] text-sm font-semibold text-white">
          {getInitial(firstName)}
        </span>
        <span className="flex flex-col text-left">
          <span className="text-sm font-medium text-[var(--uc-ink)]">{firstName || "Mi perfil"}</span>
          <span className="inline-flex items-center gap-1 text-xs text-[var(--uc-muted)]">
            Ver mi perfil
            <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </span>
      </Link>
    </div>
  );
}
