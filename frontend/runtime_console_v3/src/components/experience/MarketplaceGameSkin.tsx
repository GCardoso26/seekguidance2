"use client";

import type { ReactNode } from "react";

/**
 * @deprecated Do not wrap transactional routes (busca, PDP, cart, checkout).
 * Per-TCG skins belong on portal hubs (`PortalLayout` / `game-portal`) only.
 * OpenDesign P1 — camada permanente = shell comercial; contextual = universo do jogo.
 *
 * Prefer `GameTaxonomyChip` for a local accent when `?game=` is present.
 */
export function MarketplaceGameSkin({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
