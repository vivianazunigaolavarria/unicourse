import { cn } from "@/lib/cn";

type NoticeBannerProps = {
  title: string;
  description: string;
  tone?: "info" | "success" | "error";
};

export function NoticeBanner({ title, description, tone = "info" }: NoticeBannerProps) {
  return (
    <div
      className={cn(
        "rounded-[24px] border p-4",
        tone === "info" && "border-[rgba(107,92,224,0.18)] bg-[rgba(107,92,224,0.08)] text-[var(--uc-violet)]",
        tone === "success" && "border-[rgba(47,169,143,0.2)] bg-[rgba(47,169,143,0.1)] text-[var(--uc-teal)]",
        tone === "error" && "border-[rgba(224,149,74,0.22)] bg-[rgba(224,149,74,0.12)] text-[#a9631f]",
      )}
    >
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--uc-ink)]">{description}</p>
    </div>
  );
}
