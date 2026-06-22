export type UserLevel = "bronze" | "silver" | "gold" | "platinum" | "judge";

export type LigaPassBenefits = {
  cashback_percent: number;
  free_shipping_threshold: number | null;
  max_alerts: number;
};

export type LigaPassStats = {
  purchases: number;
  sales: number;
  decks: number;
};

export type LigaPassProfile = {
  total_xp: number;
  current_level: UserLevel;
  level_name: string;
  color_hex: string;
  xp_to_next: number;
  progress_percent: number;
  benefits: LigaPassBenefits;
  stats: LigaPassStats;
};

export type LigaPassLeaderboardEntry = {
  rank: number;
  username: string;
  display_name?: string;
  avatar: string | null;
  total_xp: number;
  level: UserLevel;
};

export const LEVEL_COLORS: Record<UserLevel, string> = {
  bronze: "#CD7F32",
  silver: "#C0C0C0",
  gold: "#FFD700",
  platinum: "#E5E4E2",
  judge: "#8B0000",
};

export const LEVEL_ORDER: UserLevel[] = ["bronze", "silver", "gold", "platinum", "judge"];

export function nextLevelLabel(current: UserLevel): string {
  const idx = LEVEL_ORDER.indexOf(current);
  if (idx < 0 || idx >= LEVEL_ORDER.length - 1) return "Máximo";
  const labels: Record<UserLevel, string> = {
    bronze: "Prata",
    silver: "Ouro",
    gold: "Platina",
    platinum: "Juiz",
    judge: "Máximo",
  };
  return labels[current] ?? "Máximo";
}
