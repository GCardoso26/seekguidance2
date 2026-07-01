export const dynamic = "force-dynamic";
export const revalidate = 0;

import type { Metadata } from "next";
import { GameCardsPageClient } from "@/components/games/GameCardsPageClient";
import { gameIdFromSlug, GAME_TOKENS } from "@/lib/tcg-tokens";
import type { GameId } from "@/types/card";
import { gameSearchMetadata } from "@/lib/seo-metadata";

type Props = {
  params: Promise<{ gameSlug: string }>;
  searchParams: Promise<{ q?: string }>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { gameSlug } = await params;
  const { q } = await searchParams;
  return gameSearchMetadata(gameSlug, q);
}

export default async function GameCardsPage({ params }: { params: Promise<{ gameSlug: string }> }) {
  const { gameSlug } = await params;
  const gameId = gameIdFromSlug(gameSlug);
  const title = gameId ? GAME_TOKENS[gameId as GameId].name : gameSlug;
  return (
    <>
      <h1 className="sr-only">Cartas de {title}</h1>
      <GameCardsPageClient slug={gameSlug} />
    </>
  );
}
