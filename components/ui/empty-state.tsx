import type { ReactNode } from "react";

import { SectionCard } from "@/components/ui/section-card";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <SectionCard className="grid gap-4 rounded-[34px] p-8 text-center">
      <div className="mx-auto h-16 w-16 rounded-full border border-[rgba(107,92,224,0.16)] bg-[rgba(107,92,224,0.08)]" />
      <div className="grid gap-2">
        <h2 className="font-heading text-3xl text-[var(--uc-ink)]">{title}</h2>
        <p className="mx-auto max-w-2xl text-[15px] leading-7 text-[var(--uc-muted)]">{description}</p>
      </div>
      {action ? <div className="flex justify-center">{action}</div> : null}
    </SectionCard>
  );
}
