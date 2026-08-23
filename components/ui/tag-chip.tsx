import { cn } from "@/lib/cn";

type TagChipProps = {
  label: string;
  color?: string | null;
  source?: "manual" | "automatic" | null;
  className?: string;
};

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "").trim();

  if (normalized.length !== 3 && normalized.length !== 6) {
    return `rgba(107, 92, 224, ${alpha})`;
  }

  const fullHex =
    normalized.length === 3
      ? normalized
          .split("")
          .map((character) => `${character}${character}`)
          .join("")
      : normalized;

  const red = Number.parseInt(fullHex.slice(0, 2), 16);
  const green = Number.parseInt(fullHex.slice(2, 4), 16);
  const blue = Number.parseInt(fullHex.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export function TagChip({ label, color, source = "manual", className }: TagChipProps) {
  const resolvedColor = color?.trim() || (source === "automatic" ? "#2fa98f" : "#6b5ce0");

  return (
    <span
      className={cn("inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium", className)}
      style={{
        borderColor: hexToRgba(resolvedColor, 0.24),
        backgroundColor: hexToRgba(resolvedColor, 0.12),
        color: resolvedColor,
      }}
    >
      {label}
    </span>
  );
}
