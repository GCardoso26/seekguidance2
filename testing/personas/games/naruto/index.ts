import { buildPersona } from "../../core/builders.ts";
import type { GamePersonaPack } from "../../core/types.ts";

/**
 * Naruto TCG — scaffold preparado (ADR-013 allowlist futura).
 * datasetReady=false: suíte E2E não executa fluxos até existir dataset.
 */
export const narutoPersonas: GamePersonaPack = {
  game: "naruto",
  datasetReady: false,
  personas: [
    buildPersona({
      id: "naruto-store-scaffold",
      email: "seller-alpha-naruto@judgetcg.test",
      password: "PersonaSeller1!",
      displayName: "Naruto Store (scaffold)",
      game: "naruto",
      role: "seller",
      behavior: "casualSeller",
      shop: {
        id: "shop-naruto-scaffold",
        slug: "naruto-store-scaffold",
        name: "Naruto Store Scaffold",
        plan: "free",
        shopEnabled: false,
      },
      inventory: [],
      listings: [],
    }),
    buildPersona({
      id: "naruto-buyer-scaffold",
      email: "buyer-alpha-naruto@judgetcg.test",
      password: "PersonaBuyer1!",
      displayName: "Naruto Buyer (scaffold)",
      game: "naruto",
      role: "buyer",
      behavior: "buyerOnly",
      wishlist: [],
    }),
    buildPersona({
      id: "naruto-collector-scaffold",
      email: "collector-alpha-naruto@judgetcg.test",
      password: "PersonaCollector1!",
      displayName: "Naruto Collector (scaffold)",
      game: "naruto",
      role: "collector",
      behavior: "collectorOnly",
      favorites: [],
      wishlist: [],
    }),
  ],
};
