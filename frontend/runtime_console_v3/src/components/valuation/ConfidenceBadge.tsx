import { cn } from "@/lib/utils";

const LABELS = {
  high: "Alta confiança",
  medium: "Média confiança",
  low: "Baixa confiança",
} as const;

const STYLES = {
  high: "bg-emerald-500/15 text-success border-emerald-500/30",
  medium: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  low: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
} as const;

interface ConfidenceBadgeProps {
  confidence: keyof typeof LABELS;
  className?: string;
}

export function ConfidenceBadge({ confidence, className }: ConfidenceBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-xs font-medium",
        STYLES[confidence],
        className,
      )}
    >
      {LABELS[confidence]}
    </span>
  );
}
