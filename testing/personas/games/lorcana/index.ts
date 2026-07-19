import { buildPersona, inv } from "../core/builders.ts";
import type { GamePersonaPack } from "../core/types.ts";

/**
 * Disney Lorcana — beachhead R1 datasets de TESTE apenas.
 * Não alimenta LPC/LCS (ambientes local/ci/staging).
 */
export const lorcanaPersonas: GamePersonaPack = {
  game: "lorcana",
  datasetReady: true,
  personas: [
    buildPersona({
      id: "lorcana-store-alpha",
      email: "seller-alpha-lorcana@judgetcg.test",
      password: "PersonaSeller1!",
      displayName: "Lorcana Store Alpha",
      game: "lorcana",
      role: "seller",
      behavior: "weeklyPublisher",
      shop: {
        id: "shop-lorcana-alpha",
        slug: "lorcana-store-alpha",
        name: "Lorcana Store Alpha",
        plan: "pro",
        shopEnabled: true,
      },
      inventory: [
        inv("Rapunzel - Gifted with Healing", 4, { tags: ["staple"], priceCents: 4500 }),
        inv("Diablo - Loyal Henchman", 6, { tags: ["staple"], priceCents: 1200 }),
        inv("Maui - Hero to All", 3, { tags: ["staple"], priceCents: 2800 }),
        inv("Be Prepared", 2, { tags: ["staple"], priceCents: 8900 }),
        inv("Elsa - Snow Queen", 1, { tags: ["enchanted", "promo"], priceCents: 25000 }),
      ],
      listings: [
        inv("Rapunzel - Gifted with Healing", 4, { tags: ["staple"], priceCents: 4500 }),
        inv("Be Prepared", 2, { tags: ["staple"], priceCents: 8900 }),
      ],
      orders: [
        {
          id: "ord-lorcana-alpha-1",
          status: "delivered",
          totalCents: 8900,
          itemNames: ["Be Prepared"],
        },
      ],
    }),
    buildPersona({
      id: "lorcana-competitive-buyer",
      email: "buyer-alpha-lorcana@judgetcg.test",
      password: "PersonaBuyer1!",
      displayName: "Lorcana Competitive",
      game: "lorcana",
      role: "buyer",
      behavior: "buyerOnly",
      shop: null,
      wishlist: [
        "Rapunzel - Gifted with Healing",
        "Be Prepared",
        "Diablo - Loyal Henchman",
        "Maui - Hero to All",
      ],
      cart: [{ cardName: "Rapunzel - Gifted with Healing", quantity: 1 }],
      orders: [],
    }),
    buildPersona({
      id: "lorcana-collector",
      email: "collector-alpha-lorcana@judgetcg.test",
      password: "PersonaCollector1!",
      displayName: "Lorcana Collector",
      game: "lorcana",
      role: "collector",
      behavior: "collectorOnly",
      shop: null,
      favorites: ["Elsa - Snow Queen", "Stitch - Rock Star"],
      wishlist: ["Enchanted Elsa", "Iconic Stitch", "Promo Mickey"],
      inventory: [],
      orders: [],
    }),
  ],
};
