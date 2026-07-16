"use client";

import { useQuery } from "@tanstack/react-query";
import { getApiClients } from "@/src/api";
import type { SearchParams } from "@/src/api/public.client";

export function useSearchCards(params: SearchParams, enabled = true) {
  const { publicApi } = getApiClients();
  const q = params.q?.trim() ?? "";

  return useQuery({
    queryKey: ["search", params],
    queryFn: () => publicApi.search(params),
    enabled: enabled && q.length > 0,
  });
}

export function useCard(cardId: string) {
  const { publicApi } = getApiClients();
  return useQuery({
    queryKey: ["card", cardId],
    queryFn: () => publicApi.getCard(cardId),
    enabled: Boolean(cardId),
  });
}

export function useCardOffers(cardId: string) {
  const { marketplaceApi } = getApiClients();
  return useQuery({
    queryKey: ["offers", cardId],
    queryFn: () => marketplaceApi.getOffers(cardId),
    enabled: Boolean(cardId),
  });
}

export function useSeller(sellerId: string | undefined) {
  const { marketplaceApi } = getApiClients();
  return useQuery({
    queryKey: ["seller", sellerId],
    queryFn: () => marketplaceApi.getSeller(sellerId!),
    enabled: Boolean(sellerId),
    staleTime: 60_000,
  });
}
