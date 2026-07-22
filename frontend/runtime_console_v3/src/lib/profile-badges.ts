/**
 * Badges — estrutura somente (persona / papel do jogador).
 * Distinto de conquistas gamificadas; sem regras de unlock complexas.
 */

export type PlayerBadgeId =
  | "judge"
  | "collector"
  | "competitive"
  | "content-creator"
  | "merchant"
  | "champion"
  | "beta-tester";

export type PlayerBadgeDef = {
  id: PlayerBadgeId;
  title: string;
  description: string;
};

export const PLAYER_BADGE_CATALOG: PlayerBadgeDef[] = [
  { id: "judge", title: "Judge", description: "Participa do ecossistema de rulings." },
  { id: "collector", title: "Colecionador", description: "Coleção ativa no JudgeTCG." },
  { id: "competitive", title: "Competitivo", description: "Foco em formatos competitivos." },
  {
    id: "content-creator",
    title: "Criador de Conteúdo",
    description: "Compartilha decks e análises.",
  },
  { id: "merchant", title: "Lojista", description: "Atua no Marketplace como vendedor." },
  { id: "champion", title: "Campeão", description: "Resultado competitivo destacado." },
  { id: "beta-tester", title: "Beta Tester", description: "Ajudou a validar o Player Profile V2." },
];

export type PlayerBadge = PlayerBadgeDef & { earned: boolean };

export type BadgesProvider = {
  listCatalog(): PlayerBadgeDef[];
  resolveForPlayer(input: {
    isSeller?: boolean;
    hasCollection?: boolean;
    hasPublicDecks?: boolean;
    isJudge?: boolean;
  }): PlayerBadge[];
};

export const defaultBadgesProvider: BadgesProvider = {
  listCatalog: () => PLAYER_BADGE_CATALOG,
  resolveForPlayer(input) {
    const earned = new Set<PlayerBadgeId>();
    if (input.isJudge) earned.add("judge");
    if (input.hasCollection) earned.add("collector");
    if (input.hasPublicDecks) earned.add("content-creator");
    if (input.isSeller) earned.add("merchant");
    earned.add("beta-tester");

    return PLAYER_BADGE_CATALOG.map((def) => ({
      ...def,
      earned: earned.has(def.id),
    }));
  },
};
