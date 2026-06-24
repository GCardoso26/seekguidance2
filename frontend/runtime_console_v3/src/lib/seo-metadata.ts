import type { Metadata } from "next";
import { GAME_TOKENS, gameIdFromSlug } from "@/lib/tcg-tokens";
import type { GameId } from "@/types/card";

const API_BASE = (process.env.API_PROXY_TARGET || process.env.NEXT_PUBLIC_API_URL || "https://seekguidance.onrender.com").replace(
  /\/$/,
  "",
);

export async function fetchCatalogHealth(): Promise<{ total_cards?: number; by_game?: Record<string, number> } | null> {
  try {
    const res = await fetch(`${API_BASE}/runtime/judge/catalog/health`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export function gameMetadataFromSlug(slug: string, cardCount?: number): Metadata {
  const gameId = gameIdFromSlug(slug);
  if (!gameId) {
    return { title: "Jogo não encontrado" };
  }
  const token = GAME_TOKENS[gameId as GameId];
  const countText =
    cardCount && cardCount > 0
      ? `${cardCount.toLocaleString("pt-BR")} cartas no catálogo.`
      : "Catálogo em sincronização.";

  return {
    title: `${token.name} — Cartas e Listagens`,
    description: `Compre e venda cards de ${token.name} no Judge TCG. ${countText} Zero comissão, PIX direto.`,
    openGraph: {
      title: `${token.name} — Judge TCG`,
      description: `Marketplace de ${token.name}`,
      images: [token.logo],
    },
  };
}

export function gameSearchMetadata(slug: string, query?: string): Metadata {
  const base = gameMetadataFromSlug(slug);
  const gameId = gameIdFromSlug(slug);
  const name = gameId ? GAME_TOKENS[gameId as GameId].name : slug;
  if (!query?.trim()) {
    return {
      ...base,
      title: `Buscar cartas — ${name}`,
    };
  }
  const q = query.trim();
  return {
    title: `${q} — Busca ${name}`,
    description: `Resultados para "${q}" em ${name} no Judge TCG.`,
  };
}
