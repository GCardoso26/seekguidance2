import type { CollectionItem } from "@/hooks/useDeck";
import { GAME_TOKENS, gameIdFromSlug } from "@/lib/tcg-tokens";
import type { GameId } from "@/types/card";

export type CollectionAlertKind =
  | "price_drop"
  | "price_up"
  | "new_offer"
  | "card_available"
  | "wishlist_hit";

export type CollectionAlertSlot = {
  kind: CollectionAlertKind;
  label: string;
  description: string;
};

export const COLLECTION_ALERT_SLOTS: CollectionAlertSlot[] = [
  {
    kind: "price_drop",
    label: "Preço caiu",
    description: "Carta da coleção ou wishlist com queda de preço.",
  },
  {
    kind: "price_up",
    label: "Preço subiu",
    description: "Valorização relevante de cartas que você possui.",
  },
  {
    kind: "new_offer",
    label: "Nova oferta",
    description: "Nova listagem marketplace para cartas que você busca.",
  },
  {
    kind: "card_available",
    label: "Carta disponível",
    description: "Carta faltante voltou a ter estoque.",
  },
  {
    kind: "wishlist_hit",
    label: "Wishlist encontrada",
    description: "Item da wishlist com oferta abaixo do preço ideal.",
  },
];

export type CollectionValueSeriesPoint = {
  date: string;
  value: number;
};

export type CollectionGameBreakdown = {
  gameCode: string;
  gameSlug: string;
  gameName: string;
  quantity: number;
  uniqueCards: number;
  value: number;
  /** Progresso estimado (0–100) quando set totals disponíveis; senão null */
  completionPct: number | null;
};

export type CollectionSetBreakdown = {
  setCode: string;
  setName: string;
  gameCode: string;
  ownedUnique: number;
  quantity: number;
  value: number;
  setTotal: number | null;
  missing: number | null;
  completionPct: number | null;
};

export type CollectionEnrichedItem = CollectionItem & {
  unitPrice: number | null;
  lineValue: number | null;
  currency: string;
  liquidity: "high" | "medium" | "low" | "unknown";
};

export type CollectionInsights = {
  totalValue: number | null;
  currency: string;
  valueChange7d: number | null;
  valueChange30d: number | null;
  valueChange7dPct: number | null;
  valueChange30dPct: number | null;
  series7d: CollectionValueSeriesPoint[];
  series30d: CollectionValueSeriesPoint[];
  series90d: CollectionValueSeriesPoint[];
  series1y: CollectionValueSeriesPoint[];
  totalCards: number;
  uniqueCards: number;
  duplicates: number;
  foilCount: number;
  premiumCount: number;
  sealedCount: number;
  accessoryCount: number;
  avgLiquidity: "high" | "medium" | "low" | "unknown";
  updatedAt: string;
  byGame: CollectionGameBreakdown[];
  bySet: CollectionSetBreakdown[];
  recentAcquisitions: CollectionEnrichedItem[];
  items: CollectionEnrichedItem[];
  insufficientHistory: boolean;
};

export function gameMetaFromCode(gameCode?: string | null): {
  slug: string;
  name: string;
  primary: string;
} {
  const code = (gameCode || "").toUpperCase();
  const token = GAME_TOKENS[code as GameId];
  if (token) {
    return { slug: token.slug, name: token.name, primary: token.primary };
  }
  const fromSlug = gameIdFromSlug((gameCode || "").toLowerCase());
  if (fromSlug && GAME_TOKENS[fromSlug]) {
    const t = GAME_TOKENS[fromSlug];
    return { slug: t.slug, name: t.name, primary: t.primary };
  }
  return {
    slug: (gameCode || "unknown").toLowerCase(),
    name: gameCode || "Desconhecido",
    primary: "#666666",
  };
}

export function completionPct(owned: number, total: number | null | undefined): number | null {
  if (total == null || total <= 0) return null;
  return Math.min(100, Math.round((owned / total) * 1000) / 10);
}

export function liquidityLabel(score: number | null | undefined): "high" | "medium" | "low" | "unknown" {
  if (score == null || Number.isNaN(score)) return "unknown";
  if (score >= 0.66) return "high";
  if (score >= 0.33) return "medium";
  return "low";
}
