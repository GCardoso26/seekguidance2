import { lorcanaCatalog, LEGACY_ID_OVERRIDES } from "../../../catalogs/index.ts";
import { composeDefaultPack } from "../../compose.ts";
import type { GamePersonaPack } from "../../core/types.ts";

/**
 * Disney Lorcana — beachhead R1 datasets de TESTE apenas.
 * Composição: archetypes × lorcanaCatalog.
 */
export const lorcanaPersonas: GamePersonaPack = {
  game: "lorcana",
  datasetReady: lorcanaCatalog.datasetReady,
  personas: composeDefaultPack(
    lorcanaCatalog,
    ["seller-large", "competitive", "collector"],
    LEGACY_ID_OVERRIDES.lorcana,
    {
      "seller-large": {
        displayName: "Lorcana Store Alpha",
        listings: lorcanaCatalog.staples.slice(0, 2),
        orders: [
          {
            id: "ord-lorcana-alpha-1",
            status: "delivered",
            totalCents: 8900,
            itemNames: ["Be Prepared"],
          },
        ],
      },
      competitive: {
        displayName: "Lorcana Competitive",
        cart: [{ cardName: "Rapunzel - Gifted with Healing", quantity: 1 }],
        orders: [],
      },
      collector: {
        displayName: "Lorcana Collector",
        inventory: [],
        orders: [],
      },
    },
  ),
};
