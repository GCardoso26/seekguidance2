import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CardDetailJsonLd } from "@/components/cards/CardDetailJsonLd";
import { CardDetailPage } from "@/components/cards/CardDetailPage";
import { API_PROXY_BASE } from "@/lib/api-proxy-base";
import { gameCardDetailPath } from "@/lib/game-routes";
import { gameIdFromSlug, GAME_TOKENS } from "@/lib/tcg-tokens";
import { withCanonical } from "@/lib/page-metadata";
import type { CardDetailResponse, GameId } from "@/types/card";

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
  params: Promise<{ gameSlug: string; cardId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { gameSlug, cardId } = await params;
  const detail = await fetchCardDetail(cardId);
  const gameId = gameIdFromSlug(gameSlug);
  const gameName = gameId ? GAME_TOKENS[gameId as GameId].name : gameSlug;

  if (!detail) {
    return withCanonical(gameCardDetailPath(gameSlug, cardId), {
      title: `Carta não encontrada — ${gameName}`,
    });
  }

  const { card } = detail;
  const lowestPrice = card.lowestPrice ?? card.latestPrice?.price;
  const currency = card.latestPrice?.currency || "BRL";
  const priceText = lowestPrice
    ? `A partir de ${new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(lowestPrice)}`
    : "Consulte preços e disponibilidade";

  return withCanonical(gameCardDetailPath(gameSlug, cardId), {
    title: `${card.name} — ${gameName}`,
    description: `${card.name}${card.set?.name ? ` · ${card.set.name}` : ""}. ${priceText}. Portal ${gameName} no JudgeTCG.`,
    openGraph: {
      title: `${card.name} | ${gameName}`,
      description: priceText,
      images: card.imageUris?.large ? [card.imageUris.large] : undefined,
      type: "website",
    },
  });
}

export default async function GameCardDetailPage({ params }: Props) {
  const { cardId } = await params;
  const detail = await fetchCardDetail(cardId);
  if (!detail) notFound();

  return (
    <>
      <CardDetailJsonLd card={detail.card} listings={detail.listings} />
      <CardDetailPage cardId={cardId} />
    </>
  );
}
