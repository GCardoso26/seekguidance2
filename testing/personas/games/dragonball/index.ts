import { dragonballCatalog, LEGACY_ID_OVERRIDES } from "../../../catalogs/index.ts";
import { composeDefaultPack } from "../../compose.ts";
import type { GamePersonaPack } from "../../core/types.ts";

export const dragonballPersonas: GamePersonaPack = {
  game: "dragonball",
  datasetReady: dragonballCatalog.datasetReady,
  personas: composeDefaultPack(
    dragonballCatalog,
    ["seller-large", "competitive", "collector"],
    LEGACY_ID_OVERRIDES.dragonball,
    {
      "seller-large": {
        displayName: "Dragon Ball Store Alpha",
        inventory: dragonballCatalog.staples.slice(0, 2),
        listings: [dragonballCatalog.staples[0]!],
      },
      competitive: { displayName: "Dragon Ball Competitive" },
      collector: { displayName: "Dragon Ball Collector" },
    },
  ),
};
