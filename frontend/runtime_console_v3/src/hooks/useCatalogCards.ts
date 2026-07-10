"use client";

import { useQuery } from "@tanstack/react-query";

export type CatalogCard = {
  id: string;
  name: string;
  set_name?: string;
  set_code?: string;
  rarity?: string;
  image_url?: string | null;
  imageUris?: { normal?: string; small?: string; large?: string } | null;
  lowest_price_cents?: number;
  language?: string;
  number?: string;
  game?: string;
};

export function useCatalogCards(game: string, search: string, page = 1) {
  return useQuery({
    queryKey: ["catalog-cards", game, search, page],
    queryFn: async () => {
      const params = new URLSearchParams({ game, page: String(page), limit: "24" });
      if (search.trim()) params.set("q", search.trim());
      const res = await fetch(`/api/seller/catalog/cards?${params}`);
      if (!res.ok) throw new Error("fetch_failed");
      return res.json() as Promise<{
        cards: CatalogCard[];
        total: number;
        has_more: boolean;
      }>;
    },
    staleTime: 30_000,
  });
}

export function useCatalogExpansions(game: string) {
  return useQuery({
    queryKey: ["catalog-expansions", game],
    queryFn: async () => {
      const res = await fetch(`/api/seller/catalog/expansions?game=${encodeURIComponent(game)}`);
      if (!res.ok) throw new Error("fetch_failed");
      return res.json() as Promise<{ expansions: Array<Record<string, unknown>> }>;
    },
  });
}

export function useCatalogGames() {
  return useQuery({
    queryKey: ["catalog-games"],
    queryFn: async () => {
      const res = await fetch("/api/seller/catalog/games");
      if (!res.ok) throw new Error("fetch_failed");
      return res.json() as Promise<{ games: Array<Record<string, unknown>> }>;
    },
    staleTime: 300_000,
  });
}
