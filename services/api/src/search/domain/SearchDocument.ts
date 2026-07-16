/**
 * Search read-model document — never Catalog SoT.
 * Filters: name, oracle, set, language, price, finish, store, stock.
 */
export interface SearchCardDocument {
  id: string;
  name: string;
  nameNormalized: string;
  oracleText: string | null;
  setCode: string | null;
  setName: string | null;
  language: string;
  rarity: string | null;
  finishes: string[];
  priceMin: number | null;
  priceMax: number | null;
  currency: string | null;
  storeIds: string[];
  stockTotal: number;
  hasStock: boolean;
  imageUrl: string | null;
  projection: string;
  updatedAt: string;
}

export interface SearchFilters {
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

export interface SearchHit {
  document: SearchCardDocument;
  score?: number;
}

export interface SearchResult {
  hits: SearchHit[];
  estimatedTotal: number;
  tookMs: number;
  projection: string;
}
