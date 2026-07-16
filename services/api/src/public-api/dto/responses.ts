/**
 * Public API DTOs — never expose Catalog / domain entities.
 * Frozen for /api/v1 (Sprint 3.5).
 */

export interface CardSummaryResponse {
  id: string;
  name: string;
  setCode: string | null;
  setName: string | null;
  language: string;
  rarity: string | null;
  imageUrl: string | null;
  priceMin: number | null;
  currency: string | null;
  hasStock: boolean;
}

export interface CardDetailsResponse extends CardSummaryResponse {
  oracleText: string | null;
  finishes: string[];
  storeIds: string[];
  stockTotal: number;
  priceMax: number | null;
  updatedAt: string;
  projection: string;
}

export interface VariantResponse {
  id: string;
  cardId: string;
  finish: string;
  language: string;
  name: string;
  setCode: string | null;
  priceMin: number | null;
  currency: string | null;
  hasStock: boolean;
  imageUrl: string | null;
}

export interface SetResponse {
  id: string;
  code: string;
  name: string | null;
  cardCount: number;
}

export interface SearchHitResponse {
  card: CardSummaryResponse;
  score?: number;
}

export interface SearchResultResponse {
  hits: SearchHitResponse[];
  estimatedTotal: number;
  tookMs: number;
  query: string | null;
  projection: string;
}

export interface SuggestHitResponse {
  id: string;
  name: string;
  setCode: string | null;
}

export interface SuggestResponse {
  suggestions: SuggestHitResponse[];
  query: string;
}
