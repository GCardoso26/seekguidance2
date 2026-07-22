/**
 * Game Theme Engine — Experience Layer (FE only).
 * Cada jogo = config; mesmos componentes, tokens diferentes.
 */
import type { CSSProperties } from "react";
import {
  ALL_GAME_IDS,
  GAME_TOKENS,
  type GameToken,
  gameIdFromSlug,
} from "@/lib/tcg-tokens";
import type { GameId } from "@/types/card";

export type GameTheme = GameToken & {
  gameId: GameId;
  /** Atmosphere / page background tint */
  bg: string;
  /** Accent for CTAs within portal */
  accent: string;
  /** Soft gradient stop for hero */
  heroGlow: string;
};

/** Extended themes — builds on GAME_TOKENS without duplicating catalog identity. */
const THEME_EXTRAS: Record<
  GameId,
  Pick<GameTheme, "bg" | "accent" | "heroGlow">
> = {
  MTG: { bg: "#0c0a09", accent: "#e11d48", heroGlow: "#C41E3A33" },
  POKEMON: { bg: "#0f172a", accent: "#fbbf24", heroGlow: "#FFCB0540" },
  YGO: { bg: "#1a0505", accent: "#facc15", heroGlow: "#8B000044" },
  LORCANA: { bg: "#0b1224", accent: "#f59e0b", heroGlow: "#1E3A8A44" },
  ONEPIECE: { bg: "#140a0a", accent: "#ef4444", heroGlow: "#DC262644" },
  FAB: { bg: "#1c1008", accent: "#fef3c7", heroGlow: "#7C2D1240" },
  DIGIMON: { bg: "#0a1628", accent: "#38bdf8", heroGlow: "#0EA5E944" },
  SWU: { bg: "#0a0a0c", accent: "#f87171", heroGlow: "#37415155" },
  RIFTBOUND: { bg: "#060a14", accent: "#eab308", heroGlow: "#C89B3C40" },
  SORCERY: { bg: "#0f0a1a", accent: "#a78bfa", heroGlow: "#7C3AED40" },
  UARENA: { bg: "#0a1224", accent: "#60a5fa", heroGlow: "#2563EB44" },
  DBFW: { bg: "#140c08", accent: "#fb923c", heroGlow: "#F9731640" },
  VANGUARD: { bg: "#06141a", accent: "#67e8f9", heroGlow: "#22D3EE40" },
};

export function getGameTheme(gameId: GameId): GameTheme {
  const token = GAME_TOKENS[gameId];
  const extra = THEME_EXTRAS[gameId];
  return {
    gameId,
    ...token,
    bg: extra.bg,
    accent: extra.accent,
    heroGlow: extra.heroGlow,
  };
}

export function getGameThemeBySlug(slug: string): GameTheme | null {
  const id = gameIdFromSlug(slug);
  if (!id) return null;
  return getGameTheme(id);
}

/** Inline CSS variables for portal shell (SSR-safe). */
export function gameThemeCssVars(theme: GameTheme): CSSProperties {
  return {
    ["--game-primary" as string]: theme.primary,
    ["--game-secondary" as string]: theme.secondary,
    ["--game-bg" as string]: theme.bg,
    ["--game-accent" as string]: theme.accent,
    ["--game-hero-glow" as string]: theme.heroGlow,
  };
}

export function listAllGameThemes(): GameTheme[] {
  return ALL_GAME_IDS.map(getGameTheme);
}

// Re-export for convenience
export type { GameId };
