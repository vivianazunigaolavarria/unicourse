import type { ReactNode } from "react";

import { SectionCard } from "@/components/ui/section-card";

type DashboardEmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function DashboardEmptyState({ title, description, action }: DashboardEmptyStateProps) {
  return (
    <SectionCard className="grid gap-4 rounded-[28px] border border-dashed border-[rgba(107,92,224,0.2)] bg-[rgba(255,255,255,0.72)] p-6 text-left shadow-none">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(107,92,224,0.08)]" />
      <div className="grid gap-2">
        <h2 className="font-heading text-2xl text-[var(--uc-ink)]">{title}</h2>
        <p className="max-w-2xl text-[15px] leading-7 text-[var(--uc-muted)]">{description}</p>
      </div>
      {action ? <div>{action}</div> : null}
    </SectionCard>
  );
}
