import { buildPersona, inv } from "../../core/builders.ts";
import type { GamePersonaPack } from "../../core/types.ts";

export const riftboundPersonas: GamePersonaPack = {
  game: "riftbound",
  datasetReady: true,
  personas: [
    buildPersona({
      id: "riftbound-store-alpha",
      email: "seller-alpha-riftbound@judgetcg.test",
      password: "PersonaSeller1!",
      displayName: "Riftbound Store Alpha",
      game: "riftbound",
      role: "seller",
      behavior: "casualSeller",
      shop: {
        id: "shop-riftbound-alpha",
        slug: "riftbound-store-alpha",
        name: "Riftbound Store Alpha",
        plan: "free",
        shopEnabled: true,
      },
      inventory: [inv("Starter Legend", 3, { tags: ["staple"], priceCents: 900 })],
      listings: [inv("Starter Legend", 3, { tags: ["staple"], priceCents: 900 })],
    }),
    buildPersona({
      id: "riftbound-buyer",
      email: "buyer-alpha-riftbound@judgetcg.test",
      password: "PersonaBuyer1!",
      displayName: "Riftbound Buyer",
      game: "riftbound",
      role: "buyer",
      behavior: "buyerOnly",
      wishlist: ["Starter Legend"],
    }),
    buildPersona({
      id: "riftbound-collector",
      email: "collector-alpha-riftbound@judgetcg.test",
      password: "PersonaCollector1!",
      displayName: "Riftbound Collector",
      game: "riftbound",
      role: "collector",
      behavior: "collectorOnly",
      favorites: ["Promo Legend"],
      wishlist: ["Iconic Legend"],
    }),
  ],
};
