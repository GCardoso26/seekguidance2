import type { Metadata } from "next";
import GameHubPage from "@/components/games/GameHubPage";
import { gameIdFromSlug, GAME_TOKENS } from "@/lib/tcg-tokens";
import { withCanonical } from "@/lib/page-metadata";
import type { GameId } from "@/types/card";

type Props = { params: Promise<{ gameSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { gameSlug } = await params;
  const gameId = gameIdFromSlug(gameSlug);
  const name = gameId ? GAME_TOKENS[gameId as GameId].name : gameSlug;
  return withCanonical(`/${gameSlug}`, {
    title: `${name} — Portal TCG`,
    description: `Singles, expansões, decks e marketplace de ${name}. Explore o universo no JudgeTCG.`,
    openGraph: {
      title: `${name} | JudgeTCG`,
      description: `Portal ${name} — coleção, decks e ofertas.`,
    },
  });
}

export default GameHubPage;
