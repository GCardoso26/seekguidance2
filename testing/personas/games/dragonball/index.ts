import { buildPersona, inv } from "../../core/builders.ts";
import type { GamePersonaPack } from "../../core/types.ts";

export const dragonballPersonas: GamePersonaPack = {
  game: "dragonball",
  datasetReady: true,
  personas: [
    buildPersona({
      id: "dragonball-store-alpha",
      email: "seller-alpha-dbfw@judgetcg.test",
      password: "PersonaSeller1!",
      displayName: "Dragon Ball Store Alpha",
      game: "dragonball",
      role: "seller",
      behavior: "weeklyPublisher",
      shop: {
        id: "shop-db-alpha",
        slug: "dragonball-store-alpha",
        name: "Dragon Ball Store Alpha",
        plan: "lojista",
        shopEnabled: true,
      },
      inventory: [
        inv("Son Goku", 6, { tags: ["staple"], priceCents: 1500 }),
        inv("Vegeta", 4, { tags: ["staple"], priceCents: 1400 }),
      ],
      listings: [inv("Son Goku", 6, { tags: ["staple"], priceCents: 1500 })],
    }),
    buildPersona({
      id: "dragonball-competitive",
      email: "buyer-alpha-dbfw@judgetcg.test",
      password: "PersonaBuyer1!",
      displayName: "Dragon Ball Competitive",
      game: "dragonball",
      role: "buyer",
      behavior: "buyerOnly",
      wishlist: ["Son Goku", "Piccolo"],
    }),
    buildPersona({
      id: "dragonball-collector",
      email: "collector-alpha-dbfw@judgetcg.test",
      password: "PersonaCollector1!",
      displayName: "Dragon Ball Collector",
      game: "dragonball",
      role: "collector",
      behavior: "collectorOnly",
      favorites: ["SCR Son Goku"],
      wishlist: ["Alt Art Vegeta"],
    }),
  ],
};
