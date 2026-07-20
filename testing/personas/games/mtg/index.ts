import { mtgCatalog, LEGACY_ID_OVERRIDES } from "../../../catalogs/index.ts";
import { composeDefaultPack } from "../../compose.ts";
import type { GamePersonaPack } from "../../core/types.ts";

export const mtgPersonas: GamePersonaPack = {
  game: "mtg",
  datasetReady: mtgCatalog.datasetReady,
  personas: composeDefaultPack(
    mtgCatalog,
    ["seller-large", "competitive", "seller-small"],
    LEGACY_ID_OVERRIDES.mtg,
    {
      "seller-large": {
        displayName: "Commander Store",
        inventory: mtgCatalog.staples.slice(0, 3),
        listings: mtgCatalog.staples.slice(0, 2),
        orders: [
          {
            id: "ord-mtg-1",
            status: "paid",
            totalCents: 3500,
            itemNames: ["Cyclonic Rift"],
          },
        ],
      },
      competitive: {
        displayName: "MTG Competitive",
        wishlist: ["Force of Will", "Brainstorm", "Swords to Plowshares"],
        cart: [{ cardName: "Sol Ring", quantity: 1 }],
      },
      "seller-small": {
        displayName: "Staples Vendor",
        inventory: mtgCatalog.staples.slice(3, 5),
        listings: [mtgCatalog.staples[3]!],
      },
    },
  ),
};
