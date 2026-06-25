export const revalidate = 60;

import type { Metadata } from "next";
import GameHubPage from "@/components/games/GameHubPage";
import { fetchCatalogHealth, gameMetadataFromSlug } from "@/lib/seo-metadata";
import { gameIdFromSlug, GAME_TOKENS } from "@/lib/tcg-tokens";
import type { GameId } from "@/types/card";

type Props = { params: Promise<{ game: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { game } = await params;
  const health = await fetchCatalogHealth();
  const gameId = gameIdFromSlug(game);
  const count = gameId && health?.by_game ? health.by_game[gameId] : undefined;
  const meta = gameMetadataFromSlug(game, count);
  const name = gameId ? GAME_TOKENS[gameId as GameId].name : game.toUpperCase();

  return {
    ...meta,
    description:
      meta.description ??
      `Compre cards de ${name} com preços em tempo real. Envio rápido e condições de NM a HP.`,
  };
}

export default GameHubPage;
