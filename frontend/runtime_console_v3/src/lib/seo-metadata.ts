import type { Metadata } from "next";
import { brand } from "@/lib/brand";
import { GAME_TOKENS, gameIdFromSlug } from "@/lib/tcg-tokens";
import type { GameId } from "@/types/card";

const API_BASE = (process.env.API_PROXY_TARGET || process.env.NEXT_PUBLIC_API_URL || "https://seekguidance.onrender.com").replace(
  /\/$/,
  "",
);

export async function fetchCatalogHealth(): Promise<{ total_cards?: number; by_game?: Record<string, number> } | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`${API_BASE}/runtime/judge/catalog/health`, {
      signal: controller.signal,
      next: { revalidate: 3600 },
    });
    clearTimeout(timeoutId);
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
    description: `Compre cards de ${token.name} com preços em tempo real no Judge TCG. ${countText} Compare estado (NM a HP), frete no carrinho e pagamento via PIX ou cartão.`,
    alternates: {
      canonical: `${brand.url.replace(/\/$/, "")}/loja/${slug}`,
    },
    openGraph: {
      title: `${token.name} — Judge TCG`,
      description: `Marketplace de ${token.name}`,
      url: `${brand.url.replace(/\/$/, "")}/loja/${slug}`,
      images: [token.logo],
    },
    twitter: {
      card: "summary_large_image",
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
