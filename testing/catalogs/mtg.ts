import { inv } from "../personas/core/builders.ts";
import type { GameCatalog } from "./types.ts";

export const mtgCatalog: GameCatalog = {
  game: "mtg",
  datasetReady: true,
  displayName: "Magic: The Gathering",
  staples: [
    inv("Sol Ring", 15, { tags: ["staple", "commander"], priceCents: 150 }),
    inv("Cyclonic Rift", 8, { tags: ["staple", "commander"], priceCents: 3500 }),
    inv("Rhystic Study", 6, { tags: ["staple", "commander"], priceCents: 4200 }),
    inv("Lightning Bolt", 40, { tags: ["staple"], priceCents: 80 }),
    inv("Counterspell", 25, { tags: ["staple"], priceCents: 120 }),
  ],
  competitiveTargets: ["Force of Will", "Brainstorm", "Swords to Plowshares", "Sol Ring"],
  collectorTargets: {
    favorites: ["Black Lotus", "Ancestral Recall"],
    wishlist: ["Mox Sapphire", "Time Walk"],
  },
};
