import { GameCard } from "@/components/games/GameCard";
import { fetchCatalogHealth } from "@/lib/seo-metadata";
import { mapHealthToGames, MOCK_CATALOG_HEALTH } from "@/lib/catalog-games";
import { DEFAULT_GAME_ORDER } from "@/lib/games";
import { GAME_TOKENS } from "@/lib/tcg-tokens";
import type { CatalogHealthReport, GameId } from "@/types/card";

export type StoreGameItem = {
  slug: string;
  name: string;
  description?: string;
  logoUrl: string;
  cardCount: number;
  primaryColor: string;
  isAvailable: boolean;
};

function asHealth(
  raw: { total_cards?: number; by_game?: Record<string, number> } | null,
): CatalogHealthReport {
  if (!raw) return MOCK_CATALOG_HEALTH;
  return {
    ...MOCK_CATALOG_HEALTH,
    total_cards: raw.total_cards ?? MOCK_CATALOG_HEALTH.total_cards,
    by_game: raw.by_game ?? MOCK_CATALOG_HEALTH.by_game,
  };
}

/** Sempre logos dos tokens locais — evita troca remote no hydrate (LCP estável). */
export function buildStoreGames(health: CatalogHealthReport | null): StoreGameItem[] {
  return mapHealthToGames(health)
    .map((g) => {
      const id = g.id as GameId;
      const token = GAME_TOKENS[id];
      const slug = token?.slug ?? id.toLowerCase();
      return {
        slug,
        name: g.name,
        logoUrl: token?.logo ?? g.logoUrl,
        cardCount: g.cardCount,
        primaryColor: g.primaryColor,
        isAvailable: g.isAvailable,
      };
    })
    .sort((a, b) => {
      const ai = DEFAULT_GAME_ORDER.indexOf(a.slug as (typeof DEFAULT_GAME_ORDER)[number]);
      const bi = DEFAULT_GAME_ORDER.indexOf(b.slug as (typeof DEFAULT_GAME_ORDER)[number]);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
}

export function GameGridView({
  games,
  priorityCount = 4,
}: {
  games: StoreGameItem[];
  priorityCount?: number;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" data-testid="store-game-grid">
      {games.map((game, i) => (
        <GameCard key={game.slug} {...game} priority={i < priorityCount} />
      ))}
    </div>
  );
}

/** First paint imediato (mock/local logos) — sem client fetch waterfall. */
export function GameGridBootstrap() {
  return <GameGridView games={buildStoreGames(MOCK_CATALOG_HEALTH)} />;
}

/** Stream opcional com contagens reais (mesmos logos token). */
export async function GameGridStream() {
  const raw = await fetchCatalogHealth();
  return <GameGridView games={buildStoreGames(asHealth(raw))} />;
}
