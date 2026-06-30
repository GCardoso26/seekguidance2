import type { GamificationBadge, GamificationBadgeCategory } from "@/types/gamification-profile";

export type BadgeUnlockStats = {
  purchases: number;
  sales: number;
  tournaments: number;
  price_alerts: number;
  reviews: number;
  rulings: number;
  community_answers: number;
  tournament_wins: number;
  fast_shipping_rate: number;
  account_created_at?: string;
  feedback_sent?: boolean;
};

export const BADGE_CATALOG: GamificationBadge[] = [
  {
    id: "first_purchase",
    name: "Primeira compra",
    description: "Realizou a primeira compra no marketplace.",
    icon: "ShoppingBag",
    category: "buyer",
    rarity: "common",
    unlock_hint: "Faça sua primeira compra",
  },
  {
    id: "loyal_buyer",
    name: "Comprador fiel",
    description: "10 compras concluídas.",
    icon: "Heart",
    category: "buyer",
    rarity: "rare",
    unlock_hint: "Complete 10 compras",
  },
  {
    id: "deal_hunter",
    name: "Caçador de pechinchas",
    description: "5 alertas de preço disparados.",
    icon: "Bell",
    category: "buyer",
    rarity: "rare",
    unlock_hint: "Ative 5 alertas de preço",
  },
  {
    id: "first_sale",
    name: "Primeira venda",
    description: "Primeira venda registrada no painel.",
    icon: "Store",
    category: "seller",
    rarity: "common",
    unlock_hint: "Registre sua primeira venda",
  },
  {
    id: "pro_seller",
    name: "Lojista pro",
    description: "100 vendas no painel lojista.",
    icon: "Crown",
    category: "seller",
    rarity: "epic",
    unlock_hint: "Alcance 100 vendas",
  },
  {
    id: "fast_shipper",
    name: "Entrega rápida",
    description: "95% dos envios em até 24h.",
    icon: "Zap",
    category: "seller",
    rarity: "rare",
    unlock_hint: "Mantenha 95% de envio em 24h",
  },
  {
    id: "first_tournament",
    name: "Primeiro torneio",
    description: "Inscrição em um torneio.",
    icon: "Trophy",
    category: "tournament",
    rarity: "common",
    unlock_hint: "Inscreva-se em um torneio",
  },
  {
    id: "champion",
    name: "Campeão",
    description: "1º lugar em um torneio.",
    icon: "Award",
    category: "tournament",
    rarity: "legendary",
    unlock_hint: "Vença um torneio",
  },
  {
    id: "tournament_regular",
    name: "Participante assíduo",
    description: "10 torneios disputados.",
    icon: "Flame",
    category: "tournament",
    rarity: "rare",
    unlock_hint: "Participe de 10 torneios",
  },
  {
    id: "judge_starter",
    name: "Juiz iniciante",
    description: "Primeira consulta ao judge RAG.",
    icon: "Scale",
    category: "community",
    rarity: "common",
    unlock_hint: "Faça 1 ruling",
  },
  {
    id: "judge_expert",
    name: "Juiz experiente",
    description: "50 rulings realizados.",
    icon: "BookOpen",
    category: "community",
    rarity: "epic",
    unlock_hint: "Faça 50 rulings",
  },
  {
    id: "helper",
    name: "Ajudante",
    description: "10 respostas úteis na comunidade.",
    icon: "Users",
    category: "community",
    rarity: "rare",
    unlock_hint: "Ajude a comunidade 10 vezes",
  },
  {
    id: "early_adopter",
    name: "Early adopter",
    description: "Conta criada antes de 2026.",
    icon: "Star",
    category: "special",
    rarity: "legendary",
    unlock_hint: "Conta antiga",
  },
  {
    id: "beta_tester",
    name: "Beta tester",
    description: "Enviou feedback ao time.",
    icon: "MessageCircle",
    category: "special",
    rarity: "rare",
    unlock_hint: "Envie feedback",
  },
];

export const BADGE_CATEGORY_LABELS: Record<GamificationBadgeCategory, string> = {
  buyer: "Comprador",
  seller: "Vendedor",
  tournament: "Torneios",
  community: "Comunidade",
  special: "Especial",
};

export function isBadgeUnlocked(badgeId: string, stats: BadgeUnlockStats): boolean {
  switch (badgeId) {
    case "first_purchase":
      return stats.purchases >= 1;
    case "loyal_buyer":
      return stats.purchases >= 10;
    case "deal_hunter":
      return stats.price_alerts >= 5;
    case "first_sale":
      return stats.sales >= 1;
    case "pro_seller":
      return stats.sales >= 100;
    case "fast_shipper":
      return stats.fast_shipping_rate >= 0.95;
    case "first_tournament":
      return stats.tournaments >= 1;
    case "champion":
      return stats.tournament_wins >= 1;
    case "tournament_regular":
      return stats.tournaments >= 10;
    case "judge_starter":
      return stats.rulings >= 1;
    case "judge_expert":
      return stats.rulings >= 50;
    case "helper":
      return stats.community_answers >= 10;
    case "early_adopter":
      return Boolean(stats.account_created_at && stats.account_created_at < "2026-01-01");
    case "beta_tester":
      return Boolean(stats.feedback_sent);
    default:
      return false;
  }
}

export function computeUnlockedBadgeIds(stats: BadgeUnlockStats): string[] {
  return BADGE_CATALOG.filter((b) => isBadgeUnlocked(b.id, stats)).map((b) => b.id);
}

export function badgesWithUnlockState(
  unlockedIds: Set<string>,
  unlockedAt: Record<string, string>,
): Array<GamificationBadge & { unlocked: boolean; unlocked_at: string | null }> {
  return BADGE_CATALOG.map((badge) => ({
    ...badge,
    unlocked: unlockedIds.has(badge.id),
    unlocked_at: unlockedAt[badge.id] ?? null,
  }));
}
