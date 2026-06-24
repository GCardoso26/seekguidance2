export const dynamic = "force-dynamic";
export const revalidate = 0;

import type { Metadata } from "next";
import { fetchCatalogHealth, gameMetadataFromSlug } from "@/lib/seo-metadata";
import { gameIdFromSlug } from "@/lib/tcg-tokens";

export { default } from "@/app/games/[game]/page";

type Props = { params: Promise<{ game: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { game } = await params;
  const health = await fetchCatalogHealth();
  const gameId = gameIdFromSlug(game);
  const count = gameId && health?.by_game ? health.by_game[gameId] : undefined;
  return gameMetadataFromSlug(game, count);
}
