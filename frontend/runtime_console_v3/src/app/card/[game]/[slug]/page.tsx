import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { API_PROXY_BASE } from "@/lib/api-proxy-base";
import { gameCardDetailPath } from "@/lib/game-routes";
import { gameIdFromSlug, GAME_TOKENS } from "@/lib/tcg-tokens";
import { withCanonical } from "@/lib/page-metadata";
import type { CardDetailResponse, GameId } from "@/types/card";

/**
 * Alias: /card/{game}/{slugOrId} → canonical /{game}/cards/{id}
 */
async function fetchCardDetail(cardId: string): Promise<CardDetailResponse | null> {
  try {
    const res = await fetch(
      `${API_PROXY_BASE}/runtime/judge/catalog/cards/${encodeURIComponent(cardId)}`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return null;
    return res.json() as Promise<CardDetailResponse>;
  } catch {
    return null;
  }
}

type Props = {
  params: Promise<{ game: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { game, slug } = await params;
  const detail = await fetchCardDetail(slug);
  const gameId = gameIdFromSlug(game);
  const gameName = gameId ? GAME_TOKENS[gameId as GameId].name : game;
  const canonical = gameCardDetailPath(game, detail?.card.id ?? slug);

  if (!detail) {
    return withCanonical(canonical, { title: `Carta não encontrada — ${gameName}` });
  }

  const { card } = detail;
  return withCanonical(canonical, {
    title: `${card.name} — ${gameName}`,
    description: `${card.name}${card.set?.name ? ` · ${card.set.name}` : ""}. Portal ${gameName} no JudgeTCG.`,
    openGraph: {
      title: `${card.name} | ${gameName}`,
      images: card.imageUris?.large ? [card.imageUris.large] : undefined,
    },
  });
}

export default async function CardAliasPage({ params }: Props) {
  const { game, slug } = await params;
  const detail = await fetchCardDetail(slug);
  if (!detail) notFound();
  redirect(gameCardDetailPath(game, detail.card.id));
}
