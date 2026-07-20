import { inv } from "../personas/core/builders.ts";
import type { GameCatalog } from "./types.ts";

export const onepieceCatalog: GameCatalog = {
  game: "onepiece",
  datasetReady: true,
  displayName: "One Piece Card Game",
  staples: [
    inv("Monkey D. Luffy", 5, { tags: ["staple"], priceCents: 3000 }),
    inv("Roronoa Zoro", 4, { tags: ["staple"], priceCents: 2200 }),
    inv("Nami", 6, { tags: ["staple"], priceCents: 900 }),
  ],
  competitiveTargets: ["Monkey D. Luffy", "Nami"],
  collectorTargets: {
    favorites: ["Alternate Art Luffy"],
    wishlist: ["Manga Rare Zoro"],
  },
};
