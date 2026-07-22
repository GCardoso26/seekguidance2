"use client";

import type { ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { gameThemeCssVars, getGameTheme } from "@/lib/experience/game-theme";
import { GAME_TOKENS } from "@/lib/tcg-tokens";
import type { GameId } from "@/types/card";

/**
 * Applies Theme Engine V2 skin to marketplace search when `?game=` is present.
 * Same Marketplace BC / BFF — only visual identity changes.
 */
export function MarketplaceGameSkin({ children }: { children: ReactNode }) {
  const params = useSearchParams();
  const raw = params.get("game")?.toUpperCase() ?? "";
  const gameId = (Object.keys(GAME_TOKENS) as GameId[]).includes(raw as GameId)
    ? (raw as GameId)
    : null;

  if (!gameId) return <>{children}</>;

  const theme = getGameTheme(gameId);
  return (
    <div
      className="game-portal marketplace-skin rounded-[var(--game-card-radius)]"
      data-game={theme.slug}
      data-mood={theme.surfaces.mood}
      data-marketplace-skin={theme.marketplace.skin}
      data-texture={theme.surfaces.texture ?? "none"}
      style={gameThemeCssVars(theme)}
    >
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--game-accent)]">
        Marketplace · {theme.name}
      </p>
      {children}
    </div>
  );
}
