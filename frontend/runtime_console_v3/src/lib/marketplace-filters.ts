import type { GameId } from "@/types/card";

export type MarketplaceSort = "relevance" | "price_asc" | "price_desc" | "newest";
export type SellerTypeFilter = "normal" | "professional" | "all";

export interface MarketplaceProductFilters {
  q?: string;
  syntaxQuery?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string[];
  gameId?: GameId | string;
  category?: string;
  storeId?: string;
  inStock?: boolean;
  sortBy?: MarketplaceSort;
  page?: number;
  limit?: number;
  sellerType?: SellerTypeFilter;
  sellerUsername?: string;
  graded?: boolean;
  gradingCompany?: string;
  gradingMinScore?: number;
  signed?: boolean;
  altered?: boolean;
  foil?: boolean;
}

export const MARKETPLACE_CONDITIONS = [
  { value: "NM", label: "Near Mint" },
  { value: "LP", label: "Lightly Played" },
  { value: "MP", label: "Moderately Played" },
  { value: "HP", label: "Heavily Played" },
] as const;

const SORT_TO_API: Record<MarketplaceSort, string> = {
  relevance: "created_at",
  price_asc: "price_asc",
  price_desc: "price_desc",
  newest: "created_at",
};

const API_TO_SORT: Record<string, MarketplaceSort> = {
  created_at: "relevance",
  price_asc: "price_asc",
  price_desc: "price_desc",
  name: "relevance",
};

export function sortToApiParam(sort?: MarketplaceSort): string {
  return SORT_TO_API[sort ?? "relevance"] ?? "created_at";
}

export function sortFromApiParam(sort: string | null): MarketplaceSort {
  return API_TO_SORT[sort ?? ""] ?? "relevance";
}

import { parseSearchSyntax } from "@/lib/marketplace-search-syntax";

export function filtersFromSearchParams(params: URLSearchParams): MarketplaceProductFilters {
  const inStock = params.get("in_stock");
  const sellerType = params.get("seller_type") as SellerTypeFilter | null;
  return {
    q: params.get("q") || params.get("search") || undefined,
    syntaxQuery: params.get("syntax") || undefined,
    minPrice: params.get("min_price") ? Number(params.get("min_price")) : undefined,
    maxPrice: params.get("max_price") ? Number(params.get("max_price")) : undefined,
    condition: params.get("condition")?.split(",").filter(Boolean),
    gameId: params.get("game_id") || undefined,
    category: params.get("category") || undefined,
    storeId: params.get("store_id") || undefined,
    inStock: inStock === "true" ? true : inStock === "false" ? false : undefined,
    sortBy: (params.get("sort") as MarketplaceSort) || "relevance",
    page: params.get("page") ? Number(params.get("page")) : 1,
    sellerType: sellerType && sellerType !== "all" ? sellerType : undefined,
    sellerUsername: params.get("seller") || undefined,
    graded: params.get("graded") === "true" ? true : undefined,
    gradingCompany: params.get("grading_company") || undefined,
    gradingMinScore: params.get("grading_min_score")
      ? Number(params.get("grading_min_score"))
      : undefined,
    signed: params.get("signed") === "true" ? true : undefined,
    altered: params.get("altered") === "true" ? true : undefined,
    foil: params.get("foil") === "true" ? true : params.get("foil") === "false" ? false : undefined,
  };
}

export function searchParamsFromFilters(filters: MarketplaceProductFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.syntaxQuery) params.set("syntax", filters.syntaxQuery);
  if (filters.minPrice !== undefined) params.set("min_price", String(filters.minPrice));
  if (filters.maxPrice !== undefined) params.set("max_price", String(filters.maxPrice));
  if (filters.condition?.length) params.set("condition", filters.condition.join(","));
  if (filters.gameId) params.set("game_id", String(filters.gameId));
  if (filters.category) params.set("category", filters.category);
  if (filters.storeId) params.set("store_id", filters.storeId);
  if (filters.inStock === true) params.set("in_stock", "true");
  if (filters.inStock === false) params.set("in_stock", "false");
  if (filters.sortBy && filters.sortBy !== "relevance") params.set("sort", filters.sortBy);
  if (filters.page && filters.page > 1) params.set("page", String(filters.page));
  if (filters.sellerType && filters.sellerType !== "all") params.set("seller_type", filters.sellerType);
  if (filters.sellerUsername) params.set("seller", filters.sellerUsername);
  if (filters.graded) params.set("graded", "true");
  if (filters.gradingCompany) params.set("grading_company", filters.gradingCompany);
  if (filters.gradingMinScore !== undefined) params.set("grading_min_score", String(filters.gradingMinScore));
  if (filters.signed) params.set("signed", "true");
  if (filters.altered) params.set("altered", "true");
  if (filters.foil === true) params.set("foil", "true");
  if (filters.foil === false) params.set("foil", "false");
  return params;
}

export function buildMarketplaceProductsQuery(filters: MarketplaceProductFilters): URLSearchParams {
  const params = new URLSearchParams();
  const parsed = filters.syntaxQuery ? parseSearchSyntax(filters.syntaxQuery) : null;
  const searchText = [filters.q, parsed?.textQuery].filter(Boolean).join(" ").trim();
  if (searchText) params.set("search", searchText);
  if (filters.minPrice !== undefined) params.set("min_price", String(filters.minPrice));
  if (filters.maxPrice !== undefined) params.set("max_price", String(filters.maxPrice));
  if (filters.condition?.length) params.set("condition", filters.condition.join(","));
  if (filters.gameId) params.set("tcg_id", String(filters.gameId));
  if (filters.category) params.set("category", filters.category);
  if (filters.storeId) params.set("store_id", filters.storeId);
  if (filters.sellerUsername) params.set("seller_username", filters.sellerUsername);
  if (filters.sellerType && filters.sellerType !== "all") params.set("seller_type", filters.sellerType);
  if (filters.graded) params.set("graded", "true");
  if (filters.gradingCompany) params.set("grading_company", filters.gradingCompany);
  if (filters.gradingMinScore !== undefined) params.set("grading_min_score", String(filters.gradingMinScore));
  if (filters.signed) params.set("signed", "true");
  if (filters.altered) params.set("altered", "true");
  if (filters.foil === true) params.set("foil", "true");
  if (filters.inStock) params.set("in_stock", "true");
  params.set("sort", sortToApiParam(filters.sortBy));
  params.set("page", String(filters.page ?? 1));
  params.set("limit", String(filters.limit ?? 24));
  return params;
}

export function countActiveMarketplaceFilters(filters: MarketplaceProductFilters): number {
  let n = 0;
  if (filters.syntaxQuery) n++;
  if (filters.minPrice !== undefined) n++;
  if (filters.maxPrice !== undefined) n++;
  if (filters.condition?.length) n += filters.condition.length;
  if (filters.gameId) n++;
  if (filters.category) n++;
  if (filters.storeId) n++;
  if (filters.inStock) n++;
  if (filters.sellerType && filters.sellerType !== "all") n++;
  if (filters.graded) n++;
  if (filters.signed) n++;
  if (filters.altered) n++;
  if (filters.foil !== undefined) n++;
  return n;
}
