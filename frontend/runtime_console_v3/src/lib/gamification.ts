import type { XpAction } from "@/types/gamification-profile";

export const MAX_LEVEL = 50;
export const MAX_XP_LEVEL_50 = 100_000;

export const GAMIFICATION_QUERY_KEY = ["gamification", "profile"] as const;
export const GAMIFICATION_BADGES_KEY = ["gamification", "badges"] as const;
export const GAMIFICATION_LEADERBOARD_KEY = ["gamification", "leaderboard"] as const;

/** XP concedido por ação. */
export const XP_REWARDS: Record<XpAction, number> = {
  marketplace_purchase: 10,
  seller_sale: 20,
  tournament_registration: 15,
  price_alert_triggered: 5,
  product_review: 5,
  friend_invite: 25,
};

export const XP_ACTION_LABELS: Record<XpAction, string> = {
  marketplace_purchase: "compra no marketplace",
  seller_sale: "venda no painel",
  tournament_registration: "inscrição em torneio",
  price_alert_triggered: "alerta de preço ativado",
  product_review: "avaliação de produto",
  friend_invite: "convite de amigo",
};

/**
 * XP total necessário para atingir `level` (nível 1 = 0).
 * Fórmula base: 100 × level^1.5, escalada para nível 50 ≈ 100.000 XP.
 */
export function totalXpForLevel(level: number): number {
  if (level <= 1) return 0;
  const raw = 100 * Math.pow(level, 1.5);
  const rawMax = 100 * Math.pow(MAX_LEVEL, 1.5);
  return Math.round((raw / rawMax) * MAX_XP_LEVEL_50);
}

export function levelFromTotalXp(totalXp: number): number {
  let level = 1;
  while (level < MAX_LEVEL && totalXp >= totalXpForLevel(level + 1)) {
    level += 1;
  }
  return level;
}

export function xpProgress(totalXp: number): {
  current_level: number;
  xp_for_current_level: number;
  xp_for_next_level: number;
  xp_to_next: number;
  progress_percent: number;
} {
  const current_level = levelFromTotalXp(totalXp);
  const xp_for_current_level = totalXpForLevel(current_level);
  const xp_for_next_level =
    current_level >= MAX_LEVEL ? totalXp : totalXpForLevel(current_level + 1);
  const span = Math.max(1, xp_for_next_level - xp_for_current_level);
  const xp_to_next = current_level >= MAX_LEVEL ? 0 : Math.max(0, xp_for_next_level - totalXp);
  const progress_percent =
    current_level >= MAX_LEVEL
      ? 100
      : Math.min(100, Math.round(((totalXp - xp_for_current_level) / span) * 100));

  return {
    current_level,
    xp_for_current_level,
    xp_for_next_level,
    xp_to_next,
    progress_percent,
  };
}

export function awardXpEstimate(currentXp: number, action: XpAction): number {
  return currentXp + XP_REWARDS[action];
}
