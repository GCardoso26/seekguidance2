import { buildPersona, inv } from "../../core/builders.ts";
import type { GamePersonaPack } from "../../core/types.ts";

export const digimonPersonas: GamePersonaPack = {
  game: "digimon",
  datasetReady: true,
  personas: [
    buildPersona({
      id: "digimon-store-alpha",
      email: "seller-alpha-digimon@judgetcg.test",
      password: "PersonaSeller1!",
      displayName: "Digimon Store Alpha",
      game: "digimon",
      role: "seller",
      behavior: "weeklyPublisher",
      shop: {
        id: "shop-digimon-alpha",
        slug: "digimon-store-alpha",
        name: "Digimon Store Alpha",
        plan: "lojista",
        shopEnabled: true,
      },
      inventory: [
        inv("Agumon", 10, { tags: ["staple"], priceCents: 200 }),
        inv("Greymon", 4, { tags: ["staple"], priceCents: 800 }),
      ],
      listings: [inv("Agumon", 10, { tags: ["staple"], priceCents: 200 })],
    }),
    buildPersona({
      id: "digimon-competitive",
      email: "buyer-alpha-digimon@judgetcg.test",
      password: "PersonaBuyer1!",
      displayName: "Digimon Competitive",
      game: "digimon",
      role: "buyer",
      behavior: "buyerOnly",
      wishlist: ["Agumon", "Gabumon"],
    }),
    buildPersona({
      id: "digimon-collector",
      email: "collector-alpha-digimon@judgetcg.test",
      password: "PersonaCollector1!",
      displayName: "Digimon Collector",
      game: "digimon",
      role: "collector",
      behavior: "collectorOnly",
      favorites: ["Omegamon"],
      wishlist: ["Alt Art Omnimon"],
    }),
  ],
};
