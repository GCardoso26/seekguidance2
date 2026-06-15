type Props = {
  name: string;
  icon?: string;
  rarity?: string;
};

const RARITY_COLORS: Record<string, string> = {
  common: "border-slate-500",
  rare: "border-blue-500",
  epic: "border-purple-500",
  legendary: "border-luxury-gold",
};

export function AchievementBadge({ name, icon, rarity = "common" }: Props) {
  return (
    <div
      className={`flex items-center gap-2 rounded-lg border bg-white/5 px-3 py-2 ${RARITY_COLORS[rarity] ?? RARITY_COLORS.common}`}
      title={name}
    >
      <span className="text-lg">{icon ?? "🏅"}</span>
      <span className="text-sm font-medium">{name}</span>
    </div>
  );
}
