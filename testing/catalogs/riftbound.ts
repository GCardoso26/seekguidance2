import { inv } from "../personas/core/builders.ts";
import type { GameCatalog } from "./types.ts";

export const riftboundCatalog: GameCatalog = {
  game: "riftbound",
  datasetReady: true,
  displayName: "Riftbound",
  staples: [inv("Starter Legend", 3, { tags: ["staple"], priceCents: 900 })],
  competitiveTargets: ["Starter Legend"],
  collectorTargets: {
    favorites: ["Promo Legend"],
    wishlist: ["Iconic Legend"],
  },
};
