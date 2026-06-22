"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateDeckInput, Deck } from "@/types/deck";

export const DECKS_QUERY_KEY = ["decks"] as const;

async function parseDeckResponse(res: Response): Promise<Deck> {
  const data = (await res.json()) as { deck?: Deck; detail?: string };
  if (!res.ok) throw new Error(data.detail ?? "Erro ao carregar deck");
  if (!data.deck) throw new Error("Deck não encontrado");
  return data.deck;
}

export function useMyDecks() {
  return useQuery({
    queryKey: [...DECKS_QUERY_KEY, "mine"],
    queryFn: async () => {
      const res = await fetch("/api/decks", { cache: "no-store" });
      if (res.status === 401) return [];
      if (!res.ok) throw new Error("Erro ao listar decks");
      const data = (await res.json()) as { decks: Deck[] };
      return data.decks ?? [];
    },
  });
}

export function usePublicDecks(game?: string) {
  return useQuery({
    queryKey: [...DECKS_QUERY_KEY, "public", game],
    queryFn: async () => {
      const qs = game ? `?game=${encodeURIComponent(game)}` : "";
      const res = await fetch(`/api/decks/public${qs}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Erro ao listar decks públicos");
      const data = (await res.json()) as { decks: Deck[] };
      return data.decks ?? [];
    },
  });
}

export function useDeck(deckId: string) {
  return useQuery({
    queryKey: [...DECKS_QUERY_KEY, deckId],
    queryFn: async () => {
      const res = await fetch(`/api/decks/${deckId}`, { cache: "no-store" });
      return parseDeckResponse(res);
    },
    enabled: Boolean(deckId),
  });
}

export function useCreateDeck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateDeckInput) => {
      const res = await fetch("/api/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      return parseDeckResponse(res);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: DECKS_QUERY_KEY });
    },
  });
}

export function useAddCardToDeck(deckId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { card_id: string; zone: string; quantity?: number }) => {
      const res = await fetch(`/api/decks/${deckId}/cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return parseDeckResponse(res);
    },
    onSuccess: (deck) => {
      qc.setQueryData([...DECKS_QUERY_KEY, deckId], deck);
      void qc.invalidateQueries({ queryKey: DECKS_QUERY_KEY });
    },
  });
}

export function useUpdateDeckCard(deckId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      deckCardId,
      quantity,
    }: {
      deckCardId: string;
      quantity: number;
    }) => {
      const res = await fetch(`/api/decks/${deckId}/cards/${deckCardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      return parseDeckResponse(res);
    },
    onSuccess: (deck) => {
      qc.setQueryData([...DECKS_QUERY_KEY, deckId], deck);
    },
  });
}

export function useRemoveDeckCard(deckId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (deckCardId: string) => {
      const res = await fetch(`/api/decks/${deckId}/cards/${deckCardId}`, {
        method: "DELETE",
      });
      return parseDeckResponse(res);
    },
    onSuccess: (deck) => {
      qc.setQueryData([...DECKS_QUERY_KEY, deckId], deck);
    },
  });
}

export function usePublishDeck(deckId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/decks/${deckId}/publish`, { method: "POST" });
      return parseDeckResponse(res);
    },
    onSuccess: (deck) => {
      qc.setQueryData([...DECKS_QUERY_KEY, deckId], deck);
      void qc.invalidateQueries({ queryKey: DECKS_QUERY_KEY });
    },
  });
}

export async function exportDeck(deckId: string, format: "text" | "dec" | "arena" = "text") {
  const res = await fetch(`/api/decks/${deckId}/export?format=${format}`);
  if (!res.ok) throw new Error("Exportação falhou");
  return res.json() as Promise<{ content: string; format: string }>;
}
