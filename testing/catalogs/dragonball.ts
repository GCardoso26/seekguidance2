import { inv } from "../personas/core/builders.ts";
import type { GameCatalog } from "./types.ts";

export const dragonballCatalog: GameCatalog = {
  game: "dragonball",
  datasetReady: true,
  displayName: "Dragon Ball Fusion World",
  staples: [
    inv("Son Goku", 6, { tags: ["staple"], priceCents: 1500 }),
    inv("Vegeta", 4, { tags: ["staple"], priceCents: 1400 }),
    inv("Piccolo", 5, { tags: ["staple"], priceCents: 700 }),
  ],
  competitiveTargets: ["Son Goku", "Piccolo"],
  collectorTargets: {
    favorites: ["SCR Son Goku"],
    wishlist: ["Alt Art Vegeta"],
  },
};
