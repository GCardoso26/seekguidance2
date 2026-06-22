"use client";

import { useQuery } from "@tanstack/react-query";
import { GameCard } from "@/components/games/GameCard";
import { catalogGameToDisplay, DEFAULT_GAME_ORDER, type CatalogGameApi } from "@/lib/games";
import { mapHealthToGames } from "@/lib/catalog-games";
import { useCatalogHealth } from "@/hooks/useCatalogHealth";
import { GAME_TOKENS } from "@/lib/tcg-tokens";
import type { GameId } from "@/types/card";

async function fetchCatalogGames(): Promise<CatalogGameApi[]> {
  const res = await fetch("/api/games");
  if (!res.ok) return [];
  const data = await res.json();
  return (data.games ?? []) as CatalogGameApi[];
}

export function GameGrid() {
  const { data: health } = useCatalogHealth();
  const { data: apiGames, isLoading } = useQuery({
    queryKey: ["catalog-games"],
    queryFn: fetchCatalogGames,
    staleTime: 60_000,
  });

  const fallbackGames = mapHealthToGames(health);
  const games =
    apiGames && apiGames.length > 0
      ? apiGames
          .map(catalogGameToDisplay)
          .sort((a, b) => {
            const ai = DEFAULT_GAME_ORDER.indexOf(a.slug as (typeof DEFAULT_GAME_ORDER)[number]);
            const bi = DEFAULT_GAME_ORDER.indexOf(b.slug as (typeof DEFAULT_GAME_ORDER)[number]);
            return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
          })
      : fallbackGames
          .sort((a, b) => {
            const slugA = GAME_TOKENS[a.id as GameId]?.slug ?? a.id.toLowerCase();
            const slugB = GAME_TOKENS[b.id as GameId]?.slug ?? b.id.toLowerCase();
            const ai = DEFAULT_GAME_ORDER.indexOf(slugA as (typeof DEFAULT_GAME_ORDER)[number]);
            const bi = DEFAULT_GAME_ORDER.indexOf(slugB as (typeof DEFAULT_GAME_ORDER)[number]);
            return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
          })
          .map((g) => ({
            slug: GAME_TOKENS[g.id as GameId]?.slug ?? g.id.toLowerCase(),
            name: g.name,
            description: undefined as string | undefined,
            logoUrl: g.logoUrl,
            cardCount: g.cardCount,
            primaryColor: g.primaryColor,
            isAvailable: g.isAvailable,
          }));

  if (isLoading && !health) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-36 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {games.map((game) => (
        <GameCard key={game.slug} {...game} />
      ))}
    </div>
  );
}
