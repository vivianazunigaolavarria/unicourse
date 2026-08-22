import { cn } from "@/lib/cn";

type StatusChipProps = {
  children: string;
  tone?: "violet" | "teal" | "amber";
};

export function StatusChip({ children, tone = "violet" }: StatusChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium",
        tone === "violet" &&
          "border-[rgba(107,92,224,0.18)] bg-[rgba(107,92,224,0.10)] text-[var(--uc-violet)]",
        tone === "teal" &&
          "border-[rgba(47,169,143,0.18)] bg-[rgba(47,169,143,0.12)] text-[var(--uc-teal)]",
        tone === "amber" &&
          "border-[rgba(224,149,74,0.18)] bg-[rgba(224,149,74,0.12)] text-[#a9631f]",
      )}
    >
      {children}
    </span>
  );
}

