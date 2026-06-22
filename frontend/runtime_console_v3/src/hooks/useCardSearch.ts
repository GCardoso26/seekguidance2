"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { fetchWithRetry } from "@/lib/api-client";
import type { CatalogSearchResponse } from "@/types/card";
import type { CatalogSetOption, SearchFilters } from "@/types/search";

const DEFAULT_LIMIT = 24;

function buildSearchParams(filters: SearchFilters, page: number): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.game) params.set("game", filters.game);
  if (filters.set) params.set("set", filters.set);
  if (filters.rarity?.length) params.set("rarity", filters.rarity.join(","));
  if (filters.condition?.length) params.set("condition", filters.condition.join(","));
  if (filters.priceMin !== undefined) params.set("price_min", String(filters.priceMin));
  if (filters.priceMax !== undefined) params.set("price_max", String(filters.priceMax));
  if (filters.language) params.set("language", filters.language);
  if (filters.foil !== null && filters.foil !== undefined) params.set("foil", String(filters.foil));
  if (filters.sortBy) params.set("sort", filters.sortBy);
  if (filters.cardIds?.length) {
    for (const id of filters.cardIds) params.append("card_id", id);
  }
  params.set("page", String(page));
  params.set("limit", String(filters.limit ?? DEFAULT_LIMIT));
  return params;
}

async function fetchCardSearch(filters: SearchFilters, page: number): Promise<CatalogSearchResponse> {
  const params = buildSearchParams(filters, page);
  const res = await fetchWithRetry(`/api/catalog/cards/search?${params.toString()}`);
  if (!res.ok) {
    throw new Error("Falha ao buscar cartas");
  }
  return res.json() as Promise<CatalogSearchResponse>;
}

export function useCardSearch(filters: SearchFilters) {
  const { page: _page, ...rest } = filters;

  return useInfiniteQuery({
    queryKey: ["cards", "search", rest],
    queryFn: ({ pageParam }) => fetchCardSearch(rest, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });
}

export function useCatalogSets(game?: string) {
  return useQuery({
    queryKey: ["catalog", "sets", game],
    queryFn: async () => {
      const params = game ? `?game=${encodeURIComponent(game)}` : "";
      const res = await fetch(`/api/catalog/sets${params}`);
      if (!res.ok) throw new Error("sets_unavailable");
      const data = (await res.json()) as { sets: CatalogSetOption[] };
      return data.sets;
    },
    staleTime: 300_000,
  });
}

export function filtersFromSearchParams(params: URLSearchParams): SearchFilters {
  const foilParam = params.get("foil");
  return {
    q: params.get("q") || undefined,
    game: params.get("game") || undefined,
    set: params.get("set") || undefined,
    rarity: params.get("rarity")?.split(",").filter(Boolean),
    condition: params.get("condition")?.split(",").filter(Boolean),
    priceMin: params.get("price_min") ? Number(params.get("price_min")) : undefined,
    priceMax: params.get("price_max") ? Number(params.get("price_max")) : undefined,
    language: params.get("language") || undefined,
    foil: foilParam === "true" ? true : foilParam === "false" ? false : null,
    sortBy: (params.get("sort") as SearchFilters["sortBy"]) || "relevance",
    cardIds: params.getAll("card_id").filter(Boolean),
  };
}

export function searchParamsFromFilters(filters: SearchFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.game) params.set("game", filters.game);
  if (filters.set) params.set("set", filters.set);
  if (filters.rarity?.length) params.set("rarity", filters.rarity.join(","));
  if (filters.condition?.length) params.set("condition", filters.condition.join(","));
  if (filters.priceMin !== undefined) params.set("price_min", String(filters.priceMin));
  if (filters.priceMax !== undefined) params.set("price_max", String(filters.priceMax));
  if (filters.language) params.set("language", filters.language);
  if (filters.foil !== null && filters.foil !== undefined) params.set("foil", String(filters.foil));
  if (filters.sortBy && filters.sortBy !== "relevance") params.set("sort", filters.sortBy);
  if (filters.cardIds?.length) {
    for (const id of filters.cardIds) params.append("card_id", id);
  }
  return params;
}
