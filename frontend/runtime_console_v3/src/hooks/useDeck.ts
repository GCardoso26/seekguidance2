"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useJudgeAuth } from "@/features/auth/AuthProvider";
import type { CreateDeckInput, Deck, DeckFormat, DeckValidation } from "@/types/deck";
import { normalizeValidationResult } from "@/lib/deck-validation";

export const DECKS_QUERY_KEY = ["decks"] as const;

async function parseDeckResponse(res: Response): Promise<Deck> {
  const data = (await res.json()) as { deck?: Deck; detail?: string };
  if (!res.ok) throw new Error(data.detail ?? "Erro ao carregar deck");
  if (!data.deck) throw new Error("Deck não encontrado");
  return data.deck;
}

export function useMyDecks() {
  const { user } = useJudgeAuth();
  return useQuery({
    queryKey: [...DECKS_QUERY_KEY, "mine"],
    queryFn: async () => {
      const res = await fetch("/api/decks", { cache: "no-store" });
      if (res.status === 401) return [];
      if (!res.ok) throw new Error("Erro ao listar decks");
      const data = (await res.json()) as { decks: Deck[] };
      return data.decks ?? [];
    },
    enabled: Boolean(user),
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

export function useDeckFormats(gameSlug?: string) {
  return useQuery({
    queryKey: ["deck-formats", gameSlug],
    queryFn: async () => {
      if (!gameSlug) return [] as DeckFormat[];
      const res = await fetch(`/api/formats/${encodeURIComponent(gameSlug)}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Erro ao carregar formatos");
      const data = (await res.json()) as { formats: DeckFormat[] };
      return data.formats ?? [];
    },
    enabled: Boolean(gameSlug),
  });
}

export function useValidateDeck(deckId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/decks/${deckId}/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner_only: true }),
      });
      if (!res.ok) throw new Error("Falha ao validar deck");
      const data = (await res.json()) as { validation: DeckValidation & { is_valid?: boolean } };
      return normalizeValidationResult(data.validation);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [...DECKS_QUERY_KEY, deckId] });
    },
  });
}

export function useUserCollection() {
  return useQuery({
    queryKey: ["user-collection"],
    queryFn: async () => {
      const res = await fetch("/api/user/collection", { cache: "no-store" });
      if (res.status === 401) return [] as CollectionItem[];
      if (!res.ok) throw new Error("Erro ao carregar coleção");
      const data = (await res.json()) as { items: CollectionItem[] };
      return data.items ?? [];
    },
  });
}

export type CollectionItem = {
  id: string;
  card_id: string;
  quantity: number;
  condition: string;
  is_foil: boolean;
  acquired_at?: string | null;
  card?: {
    name: string;
    set_code?: string;
    set_name?: string;
    game_code?: string;
    image_url?: string;
    image_uris?: Record<string, string>;
  };
};

export function useAddToCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      card_id: string;
      quantity?: number;
      condition?: string;
      is_foil?: boolean;
    }) => {
      const res = await fetch("/api/user/collection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = (await res.json()) as { detail?: string };
        throw new Error(data.detail ?? "Erro ao adicionar à coleção");
      }
      return res.json();
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["user-collection"] });
      void qc.invalidateQueries({ queryKey: ["user-collection-insights"] });
    },
  });
}

export function useUpdateCollectionItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      itemId,
      ...body
    }: {
      itemId: string;
      quantity?: number;
      condition?: string;
      is_foil?: boolean;
    }) => {
      const res = await fetch(`/api/user/collection/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Erro ao atualizar item");
      return res.json();
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["user-collection"] });
      void qc.invalidateQueries({ queryKey: ["user-collection-insights"] });
    },
  });
}

export function useRemoveCollectionItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => {
      const res = await fetch(`/api/user/collection/${itemId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao remover item");
      return res.json();
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["user-collection"] });
      void qc.invalidateQueries({ queryKey: ["user-collection-insights"] });
    },
  });
}

export async function exportDeck(deckId: string, format: "text" | "dec" | "arena" = "text") {
  const res = await fetch(`/api/decks/${deckId}/export?format=${format}`);
  if (!res.ok) throw new Error("Exportação falhou");
  return res.json() as Promise<{ content: string; format: string }>;
}
