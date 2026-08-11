"use client";

import { useReducedMotion } from "motion/react";
import BlurText from "@/components/react-bits/BlurText";
import { GameCardGallery } from "@/components/games/GameCardGallery";
import type { StoreGameItem } from "@/components/games/GameGridRsc";

export function GameGridGallery({
  games,
  priorityCount = 4,
}: {
  games: StoreGameItem[];
  priorityCount?: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="space-y-4">
      <h2 className="sr-only">Escolha seu universo</h2>
      {reduceMotion ? (
        <p className="text-lg font-semibold text-foreground" aria-hidden>
          Escolha seu universo
        </p>
      ) : (
        <BlurText
          text="Escolha seu universo"
          delay={40}
          animateBy="words"
          className="text-lg font-semibold text-foreground"
        />
      )}
      <div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        data-testid="store-game-grid"
      >
        {games.map((game, i) => (
          <GameCardGallery key={game.slug} {...game} priority={i < priorityCount} index={i} />
        ))}
      </div>
    </div>
  );
}
