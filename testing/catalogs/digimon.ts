import { inv } from "../personas/core/builders.ts";
import type { GameCatalog } from "./types.ts";

export const digimonCatalog: GameCatalog = {
  game: "digimon",
  datasetReady: true,
  displayName: "Digimon Card Game",
  staples: [
    inv("Agumon", 10, { tags: ["staple"], priceCents: 200 }),
    inv("Greymon", 4, { tags: ["staple"], priceCents: 800 }),
    inv("Gabumon", 8, { tags: ["staple"], priceCents: 250 }),
  ],
  competitiveTargets: ["Agumon", "Gabumon"],
  collectorTargets: {
    favorites: ["Omegamon"],
    wishlist: ["Alt Art Omnimon"],
  },
};
