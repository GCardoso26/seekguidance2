import { inv } from "../personas/core/builders.ts";
import type { GameCatalog } from "./types.ts";

export const lorcanaCatalog: GameCatalog = {
  game: "lorcana",
  datasetReady: true,
  displayName: "Disney Lorcana",
  staples: [
    inv("Rapunzel - Gifted with Healing", 4, { tags: ["staple"], priceCents: 4500 }),
    inv("Diablo - Loyal Henchman", 6, { tags: ["staple"], priceCents: 1200 }),
    inv("Maui - Hero to All", 3, { tags: ["staple"], priceCents: 2800 }),
    inv("Be Prepared", 2, { tags: ["staple"], priceCents: 8900 }),
    inv("Elsa - Snow Queen", 1, { tags: ["enchanted", "promo"], priceCents: 25000 }),
  ],
  premium: [
    inv("Elsa - Snow Queen", 1, { tags: ["enchanted", "promo"], priceCents: 25000 }),
  ],
  competitiveTargets: [
    "Rapunzel - Gifted with Healing",
    "Be Prepared",
    "Diablo - Loyal Henchman",
    "Maui - Hero to All",
  ],
  collectorTargets: {
    favorites: ["Elsa - Snow Queen", "Stitch - Rock Star"],
    wishlist: ["Enchanted Elsa", "Iconic Stitch", "Promo Mickey"],
  },
};
