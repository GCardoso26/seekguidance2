import { riftboundCatalog, LEGACY_ID_OVERRIDES } from "../../../catalogs/index.ts";
import { composeDefaultPack } from "../../compose.ts";
import type { GamePersonaPack } from "../../core/types.ts";

export const riftboundPersonas: GamePersonaPack = {
  game: "riftbound",
  datasetReady: riftboundCatalog.datasetReady,
  personas: composeDefaultPack(
    riftboundCatalog,
    ["seller-small", "buyer", "collector"],
    LEGACY_ID_OVERRIDES.riftbound,
    {
      "seller-small": { displayName: "Riftbound Store Alpha" },
      buyer: { displayName: "Riftbound Buyer" },
      collector: { displayName: "Riftbound Collector" },
    },
  ),
};
