/**
 * Liquidity Proof — derivado offline (Release 1 North Star).
 * Spec: docs/product/LPC_ANALYTICS_SPEC.md
 * North Star: docs/product/NORTH_STAR_RELEASE_1.md
 *
 * Invariantes (todas obrigatórias):
 *   R1-LPC-001  buyerId != sellerId
 *   R1-LPC-002  offerCount >= 1
 *   R1-LPC-003  add_to_cart após offers_viewed
 *   R1-LPC-004  mesmo cardId em toda a cadeia
 *   R1-LPC-005  janela máxima 7 dias
 */

export const INVARIANT_R1_LPC_001 = "R1-LPC-001" as const;
export const INVARIANT_R1_LPC_002 = "R1-LPC-002" as const;
export const INVARIANT_R1_LPC_003 = "R1-LPC-003" as const;
export const INVARIANT_R1_LPC_004 = "R1-LPC-004" as const;
export const INVARIANT_R1_LPC_005 = "R1-LPC-005" as const;

export const LPC_INVARIANTS = [
  INVARIANT_R1_LPC_001,
  INVARIANT_R1_LPC_002,
  INVARIANT_R1_LPC_003,
  INVARIANT_R1_LPC_004,
  INVARIANT_R1_LPC_005,
] as const;

/** R1-LPC-005 default window */
export const DEFAULT_LPC_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export type LiquidityFunnelEventName =
  | "seller_listing_published"
  | "buyer_card_open"
  | "buyer_offers_viewed"
  | "buyer_add_to_cart"
  | "liquidity_proof_completed";

export interface LiquidityAnalyticsEvent {
  name: LiquidityFunnelEventName;
  at: string;
  props?: {
    cardId?: string;
    listingId?: string;
    userId?: string;
    sessionId?: string;
    offerCount?: number;
    assistedByTeam?: boolean;
    [key: string]: unknown;
  };
}

export interface LiquidityProofCompleted {
  name: "liquidity_proof_completed";
  cardId: string;
  listingId?: string;
  sellerId: string;
  buyerId: string;
  publishedAt: string;
  cartAt: string;
}

export interface LiquidityCoverageInput {
  watchlistCardIds: string[];
  cardIdsWithOffer: string[];
}

/** LCS = watchlist cards with ≥1 offer / watchlist size (0–1). */
export function computeLiquidityCoverageScore(input: LiquidityCoverageInput): number {
  const total = input.watchlistCardIds.length;
  if (total === 0) return 0;
  const set = new Set(input.cardIdsWithOffer);
  const covered = input.watchlistCardIds.filter((id) => set.has(id)).length;
  return covered / total;
}

/** SD — mediana de listings por loja ativa. */
export function computeSupplyDepth(listingsPerActiveShop: number[]): number {
  const values = listingsPerActiveShop.filter((n) => Number.isFinite(n) && n >= 0).sort((a, b) => a - b);
  if (values.length === 0) return 0;
  const mid = Math.floor(values.length / 2);
  if (values.length % 2 === 0) {
    return (values[mid - 1]! + values[mid]!) / 2;
  }
  return values[mid]!;
}

export function computeSupplyDepthMean(activeListings: number, activeShops: number): number {
  if (activeShops <= 0) return 0;
  return activeListings / activeShops;
}

/** R1-LPC-001 */
export function satisfiesLpcInvariant001(sellerId: string, buyerId: string): boolean {
  return sellerId.length > 0 && buyerId.length > 0 && sellerId !== buyerId;
}

/** @deprecated use satisfiesLpcInvariant001 */
export const satisfiesLpcInvariant = satisfiesLpcInvariant001;

/** R1-LPC-002 — offerCount deve ser explícito e ≥ 1 */
export function satisfiesLpcInvariant002(offerCount: unknown): boolean {
  return typeof offerCount === "number" && Number.isFinite(offerCount) && offerCount >= 1;
}

function actorId(e: LiquidityAnalyticsEvent): string | undefined {
  return (e.props?.userId as string | undefined) ?? (e.props?.sessionId as string | undefined);
}

/**
 * Deriva liquidity_proof_completed — só se R1-LPC-001…005 forem verdadeiras.
 */
export function deriveLiquidityProofs(
  events: LiquidityAnalyticsEvent[],
  opts: { windowMs?: number } = {},
): LiquidityProofCompleted[] {
  const windowMs = opts.windowMs ?? DEFAULT_LPC_WINDOW_MS; // R1-LPC-005
  const sorted = [...events].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));

  const listings = sorted.filter((e) => e.name === "seller_listing_published");
  const proofs: LiquidityProofCompleted[] = [];
  const seen = new Set<string>();

  for (const listing of listings) {
    const cardId = listing.props?.cardId;
    const sellerId = actorId(listing);
    if (!cardId || !sellerId || listing.props?.assistedByTeam) continue;

    const publishedAt = Date.parse(listing.at);
    const listingId = listing.props?.listingId as string | undefined;

    const opens = sorted.filter(
      (e) =>
        e.name === "buyer_card_open" &&
        e.props?.cardId === cardId && // R1-LPC-004
        Date.parse(e.at) >= publishedAt &&
        Date.parse(e.at) - publishedAt <= windowMs, // R1-LPC-005
    );

    for (const open of opens) {
      const buyerId = actorId(open);
      if (!buyerId || !satisfiesLpcInvariant001(sellerId, buyerId)) continue; // R1-LPC-001

      const openAt = Date.parse(open.at);
      const offers = sorted.find(
        (e) =>
          e.name === "buyer_offers_viewed" &&
          e.props?.cardId === cardId && // R1-LPC-004
          actorId(e) === buyerId &&
          Date.parse(e.at) >= openAt &&
          Date.parse(e.at) - publishedAt <= windowMs && // R1-LPC-005
          satisfiesLpcInvariant002(e.props?.offerCount), // R1-LPC-002
      );
      if (!offers) continue;

      const offersAt = Date.parse(offers.at);
      const cart = sorted.find(
        (e) =>
          e.name === "buyer_add_to_cart" &&
          e.props?.cardId === cardId && // R1-LPC-004 (cardId obrigatório; listingId opcional extra)
          actorId(e) === buyerId &&
          Date.parse(e.at) >= offersAt && // R1-LPC-003
          Date.parse(e.at) - publishedAt <= windowMs, // R1-LPC-005
      );
      if (!cart) continue;

      // R1-LPC-003 reforço explícito
      if (Date.parse(cart.at) < offersAt) continue;

      const key = `${cardId}:${sellerId}:${buyerId}:${listing.at}`;
      if (seen.has(key)) continue;
      seen.add(key);

      proofs.push({
        name: "liquidity_proof_completed",
        cardId,
        listingId,
        sellerId,
        buyerId,
        publishedAt: listing.at,
        cartAt: cart.at,
      });
    }
  }

  return proofs;
}

export function computeLiquidityProofCount(
  events: LiquidityAnalyticsEvent[],
  opts?: { windowMs?: number },
): number {
  return deriveLiquidityProofs(events, opts).length;
}

/** Tendência / critério de escala (não gate). */
export function summarizeLiquidityProofTrend(proofs: LiquidityProofCompleted[]): {
  lpc: number;
  distinctSellers: number;
  distinctBuyers: number;
} {
  return {
    lpc: proofs.length,
    distinctSellers: new Set(proofs.map((p) => p.sellerId)).size,
    distinctBuyers: new Set(proofs.map((p) => p.buyerId)).size,
  };
}

/**
 * Seller Concentration Index — SCI = listings / sellers (média).
 * Sempre interpretar com distribuição (Top1 / HHI / SD).
 * @see docs/product/MARKET_VIABILITY_SCORE.md
 */
export function computeSellerConcentrationIndex(
  activeListings: number,
  activeSellers: number,
): number {
  if (activeSellers <= 0) return 0;
  return activeListings / activeSellers;
}

export interface SellerShareInput {
  sellerId: string;
  listingCount: number;
}

export interface SellerConcentrationBreakdown {
  sci: number;
  sd: number;
  top1Share: number;
  hhi: number;
  /** true quando média >> mediana → poucas lojas dominam */
  skewed: boolean;
}

export function analyzeSellerConcentration(
  perSeller: SellerShareInput[],
): SellerConcentrationBreakdown {
  const counts = perSeller.map((s) => s.listingCount).filter((n) => n > 0);
  const activeSellers = counts.length;
  const activeListings = counts.reduce((a, b) => a + b, 0);
  const sci = computeSellerConcentrationIndex(activeListings, activeSellers);
  const sd = computeSupplyDepth(counts);
  if (activeListings === 0) {
    return { sci: 0, sd: 0, top1Share: 0, hhi: 0, skewed: false };
  }
  const shares = counts.map((c) => c / activeListings);
  const top1Share = Math.max(...shares);
  const hhi = shares.reduce((a, s) => a + s * s, 0);
  return {
    sci,
    sd,
    top1Share,
    hhi,
    skewed: sci > 0 && sd > 0 ? sci / sd >= 2 : false,
  };
}

/**
 * Demand Concentration — DC50 = menor N de cartas com ≥ 50% das buscas.
 * searchesByCard: map cardId → search count (buyer_search agregados).
 */
export function computeDemandConcentration50(
  searchesByCard: Record<string, number>,
  threshold = 0.5,
): { dc50: number; totalSearches: number; topCardIds: string[] } {
  const entries = Object.entries(searchesByCard)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1]);
  const totalSearches = entries.reduce((a, [, n]) => a + n, 0);
  if (totalSearches === 0) return { dc50: 0, totalSearches: 0, topCardIds: [] };

  let cum = 0;
  const topCardIds: string[] = [];
  for (const [id, n] of entries) {
    cum += n;
    topCardIds.push(id);
    if (cum / totalSearches >= threshold) {
      return { dc50: topCardIds.length, totalSearches, topCardIds };
    }
  }
  return { dc50: topCardIds.length, totalSearches, topCardIds };
}

/** % das buscas cobertas por um conjunto de cardIds (ex.: watchlist). */
export function computeDemandShare(
  searchesByCard: Record<string, number>,
  cardIds: string[],
): number {
  const total = Object.values(searchesByCard).reduce((a, n) => a + (n > 0 ? n : 0), 0);
  if (total === 0) return 0;
  const set = new Set(cardIds);
  const covered = Object.entries(searchesByCard)
    .filter(([id, n]) => set.has(id) && n > 0)
    .reduce((a, [, n]) => a + n, 0);
  return covered / total;
}
