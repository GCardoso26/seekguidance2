import { inv } from "../personas/core/builders.ts";
import type { GameCatalog } from "./types.ts";

export const pokemonCatalog: GameCatalog = {
  game: "pokemon",
  datasetReady: true,
  displayName: "Pokémon TCG",
  staples: [
    inv("Pikachu", 12, { tags: ["staple"], priceCents: 500 }),
    inv("Charizard ex", 2, { tags: ["staple"], priceCents: 12000 }),
    inv("Professor's Research", 20, { tags: ["staple"], priceCents: 50 }),
    inv("Ultra Ball", 30, { tags: ["staple"], priceCents: 40 }),
    inv("Boss's Orders", 8, { tags: ["staple"], priceCents: 200 }),
  ],
  competitiveTargets: ["Professor's Research", "Ultra Ball", "Boss's Orders"],
  collectorTargets: {
    favorites: ["Charizard ex", "Mew ex"],
    wishlist: ["Illustration Rare Pikachu", "SAR Charizard"],
  },
};
