import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type SectionCardProps = {
  className?: string;
  children: ReactNode;
};

export function SectionCard({ className, children }: SectionCardProps) {
  return <section className={cn("uc-surface rounded-[28px] p-6", className)}>{children}</section>;
}

