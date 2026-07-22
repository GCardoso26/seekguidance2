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
  | "promo-hunter";

export type AchievementDef = {
  id: AchievementId;
  title: string;
  description: string;
  category: "collection" | "deck" | "marketplace" | "social" | "milestone";
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
  },
];

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
