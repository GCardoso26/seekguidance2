/**
 * Frozen public read contract (Sprint 3.5) — frontend / SDKs depend on this only.
 * Controllers must call SearchQueryService → Projection — never Catalog repositories.
 *
 * Expand only with new methods or optional DTO fields. Do not break signatures.
 */
import type { SearchCardDocument, SearchFilters, SearchResult } from "./SearchDocument.js";

export interface SearchSuggestHit {
  id: string;
  name: string;
  setCode: string | null;
}

export interface SearchQuery {
  q?: string;
  name?: string;
  oracle?: string;
  setCode?: string;
  language?: string;
  finish?: string;
  storeId?: string;
  hasStock?: boolean;
  priceMin?: number;
  priceMax?: number;
  rarity?: string;
  limit?: number;
  offset?: number;
}

export interface SearchQueryService {
  search(query: SearchQuery): Promise<SearchResult>;
  getCard(cardId: string): Promise<SearchCardDocument | null>;
  /** variantId format: `{cardId}:{finish}` */
  getVariant(variantId: string): Promise<SearchCardDocument | null>;
  getSet(setId: string): Promise<{ setCode: string; setName: string | null; cardCount: number } | null>;
  suggest(query: string, limit?: number): Promise<SearchSuggestHit[]>;
}

export function searchQueryToFilters(query: SearchQuery): SearchFilters {
  return { ...query };
}
