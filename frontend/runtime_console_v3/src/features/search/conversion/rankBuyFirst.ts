import { BUY_FIRST_TIER, type BuyFirstItem, type BuyFirstKind } from "./types";
import type { PurchaseIntent } from "./types";

function tierOf(kind: BuyFirstKind): number {
  return BUY_FIRST_TIER[kind];
}

/**
 * Infer kind from offer/stock signals when caller only has listing counts.
 * Never invents stock — 0 offers → out_of_stock_product or single without offers.
 */
export function kindFromOfferSignals(opts: {
  offerCount?: number;
  stock?: number;
  category?: "sealed" | "accessory" | "single" | "marketplace";
}): BuyFirstKind {
  const offers = opts.offerCount ?? 0;
  const stock = opts.stock ?? 0;
  const hasStock = offers > 0 || stock > 0;

  if (opts.category === "sealed") {
    return hasStock ? "sealed" : "out_of_stock_product";
  }
  if (opts.category === "accessory") {
    return hasStock ? "accessory" : "out_of_stock_product";
  }
  if (opts.category === "marketplace") {
    return hasStock ? "marketplace" : "out_of_stock_product";
  }
  if (hasStock) return "available_product";
  if (offers === 0 && stock === 0) {
    // Catálogo de single sem oferta ainda é produto — abaixo de disponíveis.
    return opts.category === "single" ? "single" : "out_of_stock_product";
  }
  return "single";
}

/**
 * Ranking buy-first: produtos compráveis antes de conteúdo/eventos.
 * Eventos (tier 10) nunca sobem acima de produtos.
 */
export function rankBuyFirst(
  items: BuyFirstItem[],
  opts?: { intent?: PurchaseIntent },
): BuyFirstItem[] {
  const intent = opts?.intent ?? "generic";

  return [...items].sort((a, b) => {
    let ta = tierOf(a.kind);
    let tb = tierOf(b.kind);

    // Intent boost: sealed/accessory sobem um pouco dentro da faixa de produto.
    if (intent === "sealed") {
      if (a.kind === "sealed") ta -= 0.5;
      if (b.kind === "sealed") tb -= 0.5;
    }
    if (intent === "accessory") {
      if (a.kind === "accessory") ta -= 0.5;
      if (b.kind === "accessory") tb -= 0.5;
    }

    if (ta !== tb) return ta - tb;

    const oa = a.offerCount ?? 0;
    const ob = b.offerCount ?? 0;
    if (oa !== ob) return ob - oa;

    const ra = a.relevance ?? 0;
    const rb = b.relevance ?? 0;
    if (ra !== rb) return rb - ra;

    return a.title.localeCompare(b.title, "pt-BR");
  });
}

/**
 * Ordena UnifiedCard-like por ofertas primeiro (client-side após fetch).
 */
export function rankCardsBuyFirst<
  T extends {
    id: string;
    name: string;
    listingCount?: number;
    availableStock?: number;
    marketplaceStock?: number;
    lowestPrice?: number;
  },
>(cards: T[]): T[] {
  return [...cards].sort((a, b) => {
    const offersA = a.listingCount ?? 0;
    const offersB = b.listingCount ?? 0;
    const stockA = a.availableStock ?? a.marketplaceStock ?? 0;
    const stockB = b.availableStock ?? b.marketplaceStock ?? 0;
    const buyableA = offersA > 0 || stockA > 0 || a.lowestPrice != null ? 1 : 0;
    const buyableB = offersB > 0 || stockB > 0 || b.lowestPrice != null ? 1 : 0;
    if (buyableA !== buyableB) return buyableB - buyableA;
    if (offersA !== offersB) return offersB - offersA;
    const priceA = a.lowestPrice ?? Number.POSITIVE_INFINITY;
    const priceB = b.lowestPrice ?? Number.POSITIVE_INFINITY;
    return priceA - priceB;
  });
}
