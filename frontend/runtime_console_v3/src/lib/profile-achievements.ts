/**
 * Achievements provider — estrutura apenas.
 * Consome Domain Events / APIs públicas no futuro; sem regras complexas neste épico.
 */

export type AchievementId =
  | "first-purchase"
  | "first-deck"
  | "collector"
  | "cards-100"
  | "cards-1000"
  | "deck-shared"
  | "marketplace-active"
  | "first-sale"
  | "deck-champion"
  | "set-complete"
  | "promo-hunter"
  | "top-seller"
  | "top-buyer"
  | "top-player"
  | "marketplace-legend"
  | "rare-badge-pioneer";

export type AchievementDef = {
  id: AchievementId;
  title: string;
  description: string;
  category: "collection" | "deck" | "marketplace" | "social" | "milestone";
  /** Epic 18 — rare badges + XP weight */
  rarity?: "common" | "rare" | "epic" | "legendary";
  xp?: number;
};

export const ACHIEVEMENT_CATALOG: AchievementDef[] = [
  {
    id: "first-purchase",
    title: "Primeira compra",
    description: "Concluiu o primeiro pedido no Marketplace.",
    category: "marketplace",
  },
  {
    id: "first-deck",
    title: "Primeiro deck",
    description: "Criou o primeiro deck no Workspace.",
    category: "deck",
  },
  {
    id: "collector",
    title: "Colecionador",
    description: "Adicionou cartas à coleção.",
    category: "collection",
  },
  {
    id: "cards-100",
    title: "100 cartas",
    description: "Alcançou 100 cartas únicas na coleção.",
    category: "milestone",
  },
  {
    id: "cards-1000",
    title: "1000 cartas",
    description: "Alcançou 1000 cartas únicas na coleção.",
    category: "milestone",
  },
  {
    id: "deck-shared",
    title: "Deck compartilhado",
    description: "Publicou um deck para a comunidade.",
    category: "deck",
  },
  {
    id: "marketplace-active",
    title: "Marketplace ativo",
    description: "Publicou produtos no Marketplace.",
    category: "marketplace",
  },
  {
    id: "first-sale",
    title: "Primeira venda",
    description: "Concluiu a primeira venda.",
    category: "marketplace",
  },
  {
    id: "deck-champion",
    title: "Deck campeão",
    description: "Deck associado a resultado competitivo.",
    category: "social",
  },
  {
    id: "set-complete",
    title: "Coleção completa",
    description: "Completou uma expansão (faltantes = 0).",
    category: "collection",
  },
  {
    id: "promo-hunter",
    title: "Caçador de promoções",
    description: "Comprou com alerta de preço ou economia registrada.",
    category: "marketplace",
    rarity: "rare",
    xp: 150,
  },
  {
    id: "top-seller",
    title: "Top vendedor",
    description: "Entre os vendedores com melhor performance no período.",
    category: "marketplace",
    rarity: "epic",
    xp: 400,
  },
  {
    id: "top-buyer",
    title: "Top comprador",
    description: "Volume de compras destacado no Marketplace.",
    category: "marketplace",
    rarity: "epic",
    xp: 350,
  },
  {
    id: "top-player",
    title: "Top jogador",
    description: "Presença competitiva e decks públicos em destaque.",
    category: "social",
    rarity: "epic",
    xp: 350,
  },
  {
    id: "marketplace-legend",
    title: "Lenda do Marketplace",
    description: "Vendas + reputação + liquidez sustentadas.",
    category: "marketplace",
    rarity: "legendary",
    xp: 1000,
  },
  {
    id: "rare-badge-pioneer",
    title: "Pioneiro",
    description: "Badge rara — early adopter da plataforma.",
    category: "milestone",
    rarity: "legendary",
    xp: 500,
  },
];

export type XpLevel = {
  level: number;
  xpRequired: number;
  title: string;
};

export const XP_LEVELS: readonly XpLevel[] = [
  { level: 1, xpRequired: 0, title: "Iniciante" },
  { level: 2, xpRequired: 100, title: "Colecionador" },
  { level: 3, xpRequired: 300, title: "Jogador" },
  { level: 4, xpRequired: 700, title: "Veterano" },
  { level: 5, xpRequired: 1500, title: "Lenda" },
];

export function levelForXp(xp: number): XpLevel {
  let current: XpLevel = XP_LEVELS[0];
  for (const tier of XP_LEVELS) {
    if (xp >= tier.xpRequired) current = tier;
  }
  return current;
}

export type PlayerAchievement = AchievementDef & {
  unlocked: boolean;
  unlockedAt?: string | null;
  progress?: number | null;
};

export type AchievementsProvider = {
  listCatalog(): AchievementDef[];
  /** Resolve conquistas a partir de projeções públicas (sem SQL cross-schema). */
  resolveForPlayer(input: {
    collectionUnique?: number;
    deckCount?: number;
    publicDeckCount?: number;
    orderCount?: number;
    saleCount?: number;
    listingCount?: number;
    savingsCents?: number;
  }): PlayerAchievement[];
};

export const defaultAchievementsProvider: AchievementsProvider = {
  listCatalog: () => ACHIEVEMENT_CATALOG,
  resolveForPlayer(input) {
    const unlocked = new Set<AchievementId>();
    if ((input.orderCount ?? 0) > 0) unlocked.add("first-purchase");
    if ((input.deckCount ?? 0) > 0) unlocked.add("first-deck");
    if ((input.collectionUnique ?? 0) > 0) unlocked.add("collector");
    if ((input.collectionUnique ?? 0) >= 100) unlocked.add("cards-100");
    if ((input.collectionUnique ?? 0) >= 1000) unlocked.add("cards-1000");
    if ((input.publicDeckCount ?? 0) > 0) unlocked.add("deck-shared");
    if ((input.listingCount ?? 0) > 0) unlocked.add("marketplace-active");
    if ((input.saleCount ?? 0) > 0) unlocked.add("first-sale");
    if ((input.savingsCents ?? 0) > 0) unlocked.add("promo-hunter");

    return ACHIEVEMENT_CATALOG.map((def) => ({
      ...def,
      unlocked: unlocked.has(def.id),
      unlockedAt: unlocked.has(def.id) ? null : null,
      progress: null,
    }));
  },
};
