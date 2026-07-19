import { buildPersona, inv } from "../../core/builders.ts";
import type { GamePersonaPack } from "../../core/types.ts";

export const onepiecePersonas: GamePersonaPack = {
  game: "onepiece",
  datasetReady: true,
  personas: [
    buildPersona({
      id: "onepiece-store-alpha",
      email: "seller-alpha-onepiece@judgetcg.test",
      password: "PersonaSeller1!",
      displayName: "One Piece Store Alpha",
      game: "onepiece",
      role: "seller",
      behavior: "weeklyPublisher",
      shop: {
        id: "shop-op-alpha",
        slug: "onepiece-store-alpha",
        name: "One Piece Store Alpha",
        plan: "pro",
        shopEnabled: true,
      },
      inventory: [
        inv("Monkey D. Luffy", 5, { tags: ["staple"], priceCents: 3000 }),
        inv("Roronoa Zoro", 4, { tags: ["staple"], priceCents: 2200 }),
      ],
      listings: [inv("Monkey D. Luffy", 5, { tags: ["staple"], priceCents: 3000 })],
    }),
    buildPersona({
      id: "onepiece-competitive",
      email: "buyer-alpha-onepiece@judgetcg.test",
      password: "PersonaBuyer1!",
      displayName: "One Piece Competitive",
      game: "onepiece",
      role: "buyer",
      behavior: "buyerOnly",
      wishlist: ["Monkey D. Luffy", "Nami"],
    }),
    buildPersona({
      id: "onepiece-collector",
      email: "collector-alpha-onepiece@judgetcg.test",
      password: "PersonaCollector1!",
      displayName: "One Piece Collector",
      game: "onepiece",
      role: "collector",
      behavior: "collectorOnly",
      favorites: ["Alternate Art Luffy"],
      wishlist: ["Manga Rare Zoro"],
    }),
  ],
};
