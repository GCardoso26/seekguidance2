import { buildPersona, inv } from "../../core/builders.ts";
import type { GamePersonaPack } from "../../core/types.ts";

export const pokemonPersonas: GamePersonaPack = {
  game: "pokemon",
  datasetReady: true,
  personas: [
    buildPersona({
      id: "pokemon-store-alpha",
      email: "seller-alpha-pokemon@judgetcg.test",
      password: "PersonaSeller1!",
      displayName: "Pokémon Store Alpha",
      game: "pokemon",
      role: "seller",
      behavior: "weeklyPublisher",
      shop: {
        id: "shop-pokemon-alpha",
        slug: "pokemon-store-alpha",
        name: "Pokémon Store Alpha",
        plan: "pro",
        shopEnabled: true,
      },
      inventory: [
        inv("Pikachu", 12, { tags: ["staple"], priceCents: 500 }),
        inv("Charizard ex", 2, { tags: ["staple"], priceCents: 12000 }),
        inv("Professor's Research", 20, { tags: ["staple"], priceCents: 50 }),
      ],
      listings: [inv("Charizard ex", 2, { tags: ["staple"], priceCents: 12000 })],
    }),
    buildPersona({
      id: "pokemon-collector",
      email: "collector-alpha-pokemon@judgetcg.test",
      password: "PersonaCollector1!",
      displayName: "Pokémon Collector",
      game: "pokemon",
      role: "collector",
      behavior: "collectorOnly",
      favorites: ["Charizard ex", "Mew ex"],
      wishlist: ["Illustration Rare Pikachu", "SAR Charizard"],
    }),
    buildPersona({
      id: "pokemon-competitive",
      email: "buyer-alpha-pokemon@judgetcg.test",
      password: "PersonaBuyer1!",
      displayName: "Pokémon Competitive",
      game: "pokemon",
      role: "buyer",
      behavior: "buyerOnly",
      wishlist: ["Professor's Research", "Ultra Ball", "Boss's Orders"],
      cart: [{ cardName: "Professor's Research", quantity: 4 }],
    }),
  ],
};
