import { narutoCatalog, LEGACY_ID_OVERRIDES } from "../../../catalogs/index.ts";
import { composeDefaultPack } from "../../compose.ts";
import type { GamePersonaPack } from "../../core/types.ts";

/**
 * Naruto TCG — scaffold (ADR-013). datasetReady=false.
 * Archetypes já compostos; só falta preencher narutoCatalog.staples.
 */
export const narutoPersonas: GamePersonaPack = {
  game: "naruto",
  datasetReady: narutoCatalog.datasetReady,
  personas: composeDefaultPack(
    narutoCatalog,
    ["seller-small", "buyer", "collector"],
    LEGACY_ID_OVERRIDES.naruto,
    {
      "seller-small": { displayName: "Naruto Store (scaffold)" },
      buyer: { displayName: "Naruto Buyer (scaffold)" },
      collector: { displayName: "Naruto Collector (scaffold)" },
    },
  ),
};
