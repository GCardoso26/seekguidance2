/**
 * PricingProvider — consumes external markets + internal offers.
 * Subject can be a catalog card OR a product_catalog variant.
 */
export type PricingSubjectType = "catalog_card" | "catalog_variant" | "product_variant";

export type PricingMarketCode =
  | "TCGPLAYER"
  | "CARDMARKET"
  | "CARDTRADER"
  | "EBAY"
  | "JUDGETCG";

export interface PricingSyncContext {
  requestId: string;
  subjectType: PricingSubjectType;
  subjectId: string;
  /** Optional provider external refs for mapping. */
  externalRefs?: Record<string, string>;
  currency?: "BRL" | "USD" | "EUR" | "JPY";
}

export interface PriceQuoteDTO {
  marketCode: PricingMarketCode;
  currency: string;
  minPriceCents?: number;
  avgPriceCents?: number;
  medianPriceCents?: number;
  maxPriceCents?: number;
  suggestedPriceCents?: number;
  spreadBps?: number;
  liquidityScore?: number;
  sellerCount?: number;
  sampleSize?: number;
  condition?: string;
  finish?: string;
  language?: string;
  raw?: Record<string, unknown>;
}

export interface AggregatedValuation {
  subjectType: PricingSubjectType;
  subjectId: string;
  currency: string;
  minPriceCents?: number;
  avgPriceCents?: number;
  medianPriceCents?: number;
  suggestedPriceCents?: number;
  spreadBps?: number;
  liquidityScore?: number;
  confidence: "high" | "medium" | "low";
  sources: PricingMarketCode[];
  computedAt: string;
}

export interface PricingProvider {
  readonly marketCode: PricingMarketCode;
  syncPrices(ctx: PricingSyncContext): Promise<{ ok: boolean; quotes: PriceQuoteDTO[]; error?: string }>;
  syncHistory?(ctx: PricingSyncContext): Promise<{ ok: boolean; points: number; error?: string }>;
  healthCheck?(): Promise<{ ok: boolean; message?: string }>;
}
