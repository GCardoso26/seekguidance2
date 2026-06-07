"use client";

import { useQuery } from "@tanstack/react-query";
import type { DecklistDetail } from "@/types/marketplace";

export function useDecklistDetail(id: string) {
  const query = useQuery({
    queryKey: ["marketplace-decklist", id],
    queryFn: async (): Promise<DecklistDetail> => {
      const res = await fetch(`/api/marketplace/decklists/${encodeURIComponent(id)}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Decklist não encontrada");
      const data = await res.json();
      const listing = data.listing as Record<string, unknown>;
      const reviews = (data.reviews as Array<Record<string, unknown>>) ?? [];
      return {
        id: String(listing.id),
        name: String(listing.name),
        game_code: String(listing.game_code),
        format: String(listing.format),
        description: listing.description ? String(listing.description) : undefined,
        price_cents: Number(listing.price_cents),
        sales_count: Number(listing.sales_count ?? 0),
        average_rating: Number(listing.average_rating ?? 0),
        decklist_data: (listing.decklist_data as Record<string, unknown>) ?? {},
        seller_handle: listing.seller_handle ? String(listing.seller_handle) : undefined,
        seller_name: listing.seller_name ? String(listing.seller_name) : undefined,
        reviews: reviews.map((r) => ({
          id: String(r.id),
          rating: Number(r.rating),
          comment: r.comment ? String(r.comment) : undefined,
          title: r.title ? String(r.title) : undefined,
          handle: r.handle ? String(r.handle) : undefined,
          display_name: r.display_name ? String(r.display_name) : undefined,
        })),
      };
    },
    enabled: Boolean(id),
  });

  return {
    decklist: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}
