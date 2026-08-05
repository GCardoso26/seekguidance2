/** Customer Conversion First — tipos de ranking buy-first. */

export type PurchaseIntent = "single" | "sealed" | "accessory" | "generic";

/** Ordem de prioridade (menor = mais alto). Alinhado ao plano CVC. */
export const BUY_FIRST_TIER = {
  available_product: 1,
  out_of_stock_product: 2,
  marketplace: 3,
  sealed: 4,
  accessory: 5,
  single: 6,
  knowledge: 7,
  decks: 8,
  articles: 9,
  events: 10,
} as const;

export type BuyFirstTier = (typeof BUY_FIRST_TIER)[keyof typeof BUY_FIRST_TIER];

export type BuyFirstKind =
  | "available_product"
  | "out_of_stock_product"
  | "marketplace"
  | "sealed"
  | "accessory"
  | "single"
  | "knowledge"
  | "decks"
  | "articles"
  | "events";

export type BuyFirstItem = {
  id: string;
  title: string;
  kind: BuyFirstKind;
  /** Ofertas ativas (0 = sem oferta). */
  offerCount?: number;
  /** Unidades em estoque, se conhecido. */
  stock?: number;
  /** Score secundário (relevância fuzzy etc.) — maior = melhor. */
  relevance?: number;
};

export const EMPTY_OFFERS_MESSAGE =
  "Ainda não existem ofertas deste item no marketplace.";

export const NO_STOCK_CARD_MESSAGE = "No momento este produto está sem ofertas.";
