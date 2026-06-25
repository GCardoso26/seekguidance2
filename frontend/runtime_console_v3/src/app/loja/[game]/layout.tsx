import type { Metadata } from "next";
import { fetchCatalogHealth, gameMetadataFromSlug } from "@/lib/seo-metadata";
import { ALL_GAME_IDS, GAME_TOKENS, gameIdFromSlug } from "@/lib/tcg-tokens";
import type { GameId } from "@/types/card";

type Props = {
  children: React.ReactNode;
  params: Promise<{ game: string }>;
};

export function generateStaticParams() {
  return ALL_GAME_IDS.map((id) => ({ game: GAME_TOKENS[id].slug }));
}

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
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

export default function GameLojaLayout({ children }: Pick<Props, "children">) {
  return children;
}
