import { GameExpansionsPageClient } from "@/components/games/GameExpansionsPageClient";
import { GAME_TOKENS, gameIdFromSlug } from "@/lib/tcg-tokens";
import type { GameId } from "@/types/card";
import type { Metadata } from "next";

type Props = { params: Promise<{ gameSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { gameSlug } = await params;
  const gameId = gameIdFromSlug(gameSlug);
  const name = gameId ? GAME_TOKENS[gameId as GameId].name : gameSlug;
  return {
    title: `Expansões — ${name} | Judge TCG`,
    description: `Todos os sets e expansões de ${name} no catálogo Judge TCG.`,
  };
}

export default async function GameExpansionsPage({ params }: Props) {
  const { gameSlug } = await params;
  return <GameExpansionsPageClient slug={gameSlug} />;
}
