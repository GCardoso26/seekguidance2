import { digimonCatalog, LEGACY_ID_OVERRIDES } from "../../../catalogs/index.ts";
import { composeDefaultPack } from "../../compose.ts";
import type { GamePersonaPack } from "../../core/types.ts";

export const digimonPersonas: GamePersonaPack = {
  game: "digimon",
  datasetReady: digimonCatalog.datasetReady,
  personas: composeDefaultPack(
    digimonCatalog,
    ["seller-large", "competitive", "collector"],
    LEGACY_ID_OVERRIDES.digimon,
    {
      "seller-large": {
        displayName: "Digimon Store Alpha",
        inventory: digimonCatalog.staples.slice(0, 2),
        listings: [digimonCatalog.staples[0]!],
      },
      competitive: { displayName: "Digimon Competitive" },
      collector: { displayName: "Digimon Collector" },
    },
  ),
};
