import { pokemonCatalog, LEGACY_ID_OVERRIDES } from "../../../catalogs/index.ts";
import { composeDefaultPack } from "../../compose.ts";
import type { GamePersonaPack } from "../../core/types.ts";

export const pokemonPersonas: GamePersonaPack = {
  game: "pokemon",
  datasetReady: pokemonCatalog.datasetReady,
  personas: composeDefaultPack(
    pokemonCatalog,
    ["seller-large", "collector", "competitive"],
    LEGACY_ID_OVERRIDES.pokemon,
    {
      "seller-large": {
        displayName: "Pokémon Store Alpha",
        inventory: pokemonCatalog.staples.slice(0, 3),
        listings: [pokemonCatalog.staples[1]!],
      },
      collector: {
        displayName: "Pokémon Collector",
      },
      competitive: {
        displayName: "Pokémon Competitive",
        cart: [{ cardName: "Professor's Research", quantity: 4 }],
      },
    },
  ),
};
