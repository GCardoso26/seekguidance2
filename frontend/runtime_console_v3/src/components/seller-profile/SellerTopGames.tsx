"use client";

import { GAME_TOKENS } from "@/lib/tcg-tokens";
import type { SellerTopGame } from "@/lib/seller-analytics-query";

type Props = {
  games: SellerTopGame[];
  onSelectGame?: (gameSlug: string) => void;
  selectedGame?: string;
};

export function SellerTopGames({ games, onSelectGame, selectedGame }: Props) {
  if (games.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground">Jogos mais vendidos</h3>
      <div className="flex flex-wrap gap-2">
        {games.map((game) => {
          const token = Object.values(GAME_TOKENS).find((t) => t.slug === game.game_slug);
          const color = token?.primary ?? "#0066FF";
          const active = selectedGame === game.game_slug;
          return (
            <button
              key={game.game_slug}
              type="button"
              onClick={() => onSelectGame?.(game.game_slug)}
              className="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
              style={{
                borderColor: active ? color : `${color}55`,
                backgroundColor: active ? `${color}22` : "transparent",
                color: active ? color : undefined,
              }}
            >
              {game.game_name}
              <span className="ml-1 text-muted-foreground">({game.sales_count})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
