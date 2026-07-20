import type { GameCatalog } from "./types.ts";

/** Scaffold — datasetReady=false até existir allowlist/produto (ADR-013). */
export const narutoCatalog: GameCatalog = {
  game: "naruto",
  datasetReady: false,
  displayName: "Naruto TCG (scaffold)",
  staples: [],
  competitiveTargets: [],
  collectorTargets: {
    favorites: [],
    wishlist: [],
  },
};
