import type { Metadata } from "next";
import { notFound, redirect, RedirectType } from "next/navigation";
import { isKnownGameSlug } from "@/lib/game-routes";
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

/**
 * Alias legado /loja/{jogo} → canônico /{jogo}.
 * Hard-exit (ADR-016) e slug desconhecido → 404 (simétrico a [gameSlug]/layout).
 */
export default async function GameLojaLayout({ children: _children, params }: Props) {
  const { game } = await params;
  if (!isKnownGameSlug(game)) notFound();
  redirect(`/${game}`, RedirectType.replace);
}
