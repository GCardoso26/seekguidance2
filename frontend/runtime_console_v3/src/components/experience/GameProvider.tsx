"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  getGameTheme,
  type GameTheme,
} from "@/lib/experience/game-theme";
import type { GameId } from "@/types/card";

type GameContextValue = {
  gameId: GameId;
  slug: string;
  theme: GameTheme;
};

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({
  gameId,
  slug,
  children,
}: {
  gameId: GameId;
  slug: string;
  children: ReactNode;
}) {
  const value = useMemo(
    () => ({
      gameId,
      slug,
      theme: getGameTheme(gameId),
    }),
    [gameId, slug],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGamePortal(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error("useGamePortal must be used within GameProvider");
  }
  return ctx;
}

/** Safe for components that may render outside portal. */
export function useGamePortalOptional(): GameContextValue | null {
  return useContext(GameContext);
}
