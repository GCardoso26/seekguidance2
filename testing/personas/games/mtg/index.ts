import { buildPersona, inv } from "../../core/builders.ts";
import type { GamePersonaPack } from "../../core/types.ts";

export const mtgPersonas: GamePersonaPack = {
  game: "mtg",
  datasetReady: true,
  personas: [
    buildPersona({
      id: "mtg-commander-store",
      email: "seller-alpha-mtg@judgetcg.test",
      password: "PersonaSeller1!",
      displayName: "Commander Store",
      game: "mtg",
      role: "seller",
      behavior: "weeklyPublisher",
      shop: {
        id: "shop-mtg-commander",
        slug: "commander-store",
        name: "Commander Store",
        plan: "pro",
        shopEnabled: true,
      },
      inventory: [
        inv("Sol Ring", 15, { tags: ["staple", "commander"], priceCents: 150 }),
        inv("Cyclonic Rift", 8, { tags: ["staple", "commander"], priceCents: 3500 }),
        inv("Rhystic Study", 6, { tags: ["staple", "commander"], priceCents: 4200 }),
      ],
      listings: [
        inv("Sol Ring", 15, { tags: ["staple", "commander"], priceCents: 150 }),
        inv("Cyclonic Rift", 8, { tags: ["staple", "commander"], priceCents: 3500 }),
      ],
      orders: [
        {
          id: "ord-mtg-1",
          status: "paid",
          totalCents: 3500,
          itemNames: ["Cyclonic Rift"],
        },
      ],
    }),
    buildPersona({
      id: "mtg-competitive-buyer",
      email: "buyer-alpha-mtg@judgetcg.test",
      password: "PersonaBuyer1!",
      displayName: "MTG Competitive",
      game: "mtg",
      role: "buyer",
      behavior: "buyerOnly",
      wishlist: ["Force of Will", "Brainstorm", "Swords to Plowshares"],
      cart: [{ cardName: "Sol Ring", quantity: 1 }],
    }),
    buildPersona({
      id: "mtg-staples-seller",
      email: "seller-staples-mtg@judgetcg.test",
      password: "PersonaSeller1!",
      displayName: "Staples Vendor",
      game: "mtg",
      role: "seller",
      behavior: "competitiveSeller",
      shop: {
        id: "shop-mtg-staples",
        slug: "staples-vendor",
        name: "Staples Vendor",
        plan: "lojista",
        shopEnabled: true,
      },
      inventory: [
        inv("Lightning Bolt", 40, { tags: ["staple"], priceCents: 80 }),
        inv("Counterspell", 25, { tags: ["staple"], priceCents: 120 }),
      ],
      listings: [inv("Lightning Bolt", 40, { tags: ["staple"], priceCents: 80 })],
    }),
  ],
};
