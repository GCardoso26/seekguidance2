import type { Metadata } from "next";
import { gameIdFromSlug, GAME_TOKENS } from "@/lib/tcg-tokens";
import { gameCardsPath } from "@/lib/game-routes";
import { withCanonical } from "@/lib/page-metadata";
import type { GameId } from "@/types/card";
import { GameCardsPageClient } from "@/components/games/GameCardsPageClient";
import { gameSearchMetadata } from "@/lib/seo-metadata";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: Promise<{ gameSlug: string }>;
  searchParams: Promise<{ q?: string }>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { gameSlug } = await params;
  const { q } = await searchParams;
  const base = await gameSearchMetadata(gameSlug, q);
  const gameId = gameIdFromSlug(gameSlug);
  const name = gameId ? GAME_TOKENS[gameId as GameId].name : gameSlug;
  return withCanonical(gameCardsPath(gameSlug), {
    ...base,
    title: base.title ?? `Cartas — ${name}`,
  });
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
