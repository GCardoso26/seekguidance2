export interface SearchFilters {
  q?: string;
  game?: string;
  set?: string;
  rarity?: string[];
  condition?: string[];
  priceMin?: number;
  priceMax?: number;
  language?: string;
  foil?: boolean | null;
  sortBy?: "relevance" | "price_asc" | "price_desc" | "name_asc" | "name_desc" | "newest";
  page?: number;
  limit?: number;
}

export interface CatalogSetOption {
  code: string;
  name: string;
  cardCount?: number;
}
