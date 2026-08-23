import Link from "next/link";

import { SignOutForm } from "@/components/auth/sign-out-form";
import { StatusChip } from "@/components/ui/status-chip";
import { formatAccountStatusLabel, formatRoleLabel } from "@/lib/labels";
import { getDisplayName, type ViewerProfile } from "@/lib/profile";

type SessionRailProps = {
  viewer: ViewerProfile;
  variant: "admin" | "student";
  highlight?: {
    label: string;
    value: string;
  } | null;
  quickLinks?: Array<{
    href: string;
    label: string;
    variant?: "primary" | "secondary";
  }>;
};

export function SessionRail({ viewer, variant, highlight, quickLinks }: SessionRailProps) {
  return (
    <div className="grid gap-3">
      <div className="rounded-[24px] border border-[var(--uc-border)] bg-[rgba(255,255,255,0.82)] p-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusChip tone={variant === "admin" ? "violet" : "teal"}>{formatRoleLabel(viewer.role)}</StatusChip>
          <span className="text-xs uppercase tracking-[0.16em] text-[var(--uc-muted)]">
            {formatAccountStatusLabel(viewer.account_status)}
          </span>
        </div>
        <p className="mt-3 font-heading text-2xl text-[var(--uc-ink)]">{getDisplayName(viewer)}</p>
        <p className="mt-2 text-sm leading-6 text-[var(--uc-muted)]">{viewer.email}</p>
        {viewer.country ? <p className="text-sm leading-6 text-[var(--uc-muted)]">{viewer.country}</p> : null}
      </div>

      {highlight ? (
        <div className="rounded-[24px] border border-[var(--uc-border)] bg-[rgba(47,169,143,0.08)] p-4">
          <p className="uc-kicker">{highlight.label}</p>
          <p className="mt-2 text-sm font-medium leading-6 text-[var(--uc-ink)]">{highlight.value}</p>
        </div>
      ) : null}

      {quickLinks?.length ? (
        <div className="grid gap-3 rounded-[24px] border border-[var(--uc-border)] bg-[rgba(255,255,255,0.82)] p-4">
          <p className="uc-kicker">Cambio rápido</p>
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              className={link.variant === "primary" ? "uc-button-primary justify-center" : "uc-button-secondary justify-center"}
              href={link.href}
            >
              {link.label}
            </Link>
          ))}
        </div>
      ) : null}

      <SignOutForm />
    </div>
  );
}
