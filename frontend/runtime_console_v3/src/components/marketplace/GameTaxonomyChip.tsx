"use client";

import { useSearchParams } from "next/navigation";
import { GAME_TOKENS } from "@/lib/tcg-tokens";
import type { GameId } from "@/types/card";

/**
 * Taxonomy chip for transactional surfaces (search, listing).
 * Accent color only — never applies game-portal mood/skin/texture.
 * OpenDesign P1: protect purchase flows from per-TCG skins.
 */
export function GameTaxonomyChip({ className }: { className?: string }) {
  const params = useSearchParams();
  const raw = params.get("game")?.toUpperCase() ?? "";
  const gameId = (Object.keys(GAME_TOKENS) as GameId[]).includes(raw as GameId)
    ? (raw as GameId)
    : null;

  if (!gameId) return null;

  const token = GAME_TOKENS[gameId];
  return (
    <p
      className={className ?? "mb-4 inline-flex items-center gap-2 text-caption font-semibold uppercase tracking-[0.08em] text-muted-foreground"}
      data-testid="game-taxonomy-chip"
    >
      <span
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: token.primary }}
        aria-hidden
      />
      <span
        className="rounded border px-2 py-0.5 text-foreground"
        style={{ borderColor: token.primary }}
      >
        {token.name}
      </span>
    </p>
  );
}
