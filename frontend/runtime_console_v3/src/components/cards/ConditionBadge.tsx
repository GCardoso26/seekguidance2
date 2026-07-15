export type CardCondition = "NM" | "LP" | "MP" | "HP" | "DM";

export const CONDITION_CONFIG: Record<
  CardCondition,
  { label: string; fullLabel: string; color: string }
> = {
  NM: { label: "Quase nova", fullLabel: "Quase nova (NM)", color: "#22C55E" },
  LP: { label: "Pouco usada", fullLabel: "Pouco usada (LP)", color: "#3B82F6" },
  MP: { label: "Usada", fullLabel: "Usada (MP)", color: "#EAB308" },
  HP: { label: "Muito usada", fullLabel: "Muito usada (HP)", color: "#F97316" },
  DM: { label: "Danificada", fullLabel: "Danificada (DM)", color: "#EF4444" },
};

interface ConditionBadgeProps {
  condition: CardCondition;
  size?: "sm" | "md";
  showTooltip?: boolean;
}

export function ConditionBadge({ condition, size = "sm", showTooltip = true }: ConditionBadgeProps) {
  const config = CONDITION_CONFIG[condition] ?? CONDITION_CONFIG.NM;

  return (
    <span
      className={`inline-flex items-center rounded font-medium ${
        size === "sm" ? "px-1.5 py-0.5 text-caption" : "px-2 py-1 text-xs"
      }`}
      style={{
        backgroundColor: `${config.color}20`,
        color: config.color,
      }}
      title={showTooltip ? config.fullLabel : undefined}
    >
      {config.label}
    </span>
  );
}
