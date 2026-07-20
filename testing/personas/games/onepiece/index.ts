import { onepieceCatalog, LEGACY_ID_OVERRIDES } from "../../../catalogs/index.ts";
import { composeDefaultPack } from "../../compose.ts";
import type { GamePersonaPack } from "../../core/types.ts";

export const onepiecePersonas: GamePersonaPack = {
  game: "onepiece",
  datasetReady: onepieceCatalog.datasetReady,
  personas: composeDefaultPack(
    onepieceCatalog,
    ["seller-large", "competitive", "collector"],
    LEGACY_ID_OVERRIDES.onepiece,
    {
      "seller-large": {
        displayName: "One Piece Store Alpha",
        inventory: onepieceCatalog.staples.slice(0, 2),
        listings: [onepieceCatalog.staples[0]!],
      },
      competitive: { displayName: "One Piece Competitive" },
      collector: { displayName: "One Piece Collector" },
    },
  ),
};
