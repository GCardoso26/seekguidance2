import { ProductCategory } from "../../domain/enums.js";
import { BaseProductCatalogProvider } from "../BaseProductCatalogProvider.js";

function brandProvider(providerId: string, category: ProductCategory, brandName: string) {
  return class extends BaseProductCatalogProvider {
    readonly providerId = providerId;
    readonly category = category;
    readonly brandName = brandName;
  };
}

/** Registro de providers por job — cada um independente; implementação incremental. */
export const DragonShieldSleevesProvider = brandProvider(
  "dragon-shield-sleeves",
  ProductCategory.SLEEVES,
  "Dragon Shield",
);
export const GamegenicSleevesProvider = brandProvider(
  "gamegenic-sleeves",
  ProductCategory.SLEEVES,
  "Gamegenic",
);
export const UltimateGuardSleevesProvider = brandProvider(
  "ultimate-guard-sleeves",
  ProductCategory.SLEEVES,
  "Ultimate Guard",
);
export const UltraProSleevesProvider = brandProvider(
  "ultra-pro-sleeves",
  ProductCategory.SLEEVES,
  "Ultra PRO",
);

export const UltimateGuardDeckBoxProvider = brandProvider(
  "ultimate-guard-deckbox",
  ProductCategory.DECK_BOX,
  "Ultimate Guard",
);
export const UltraProDeckBoxProvider = brandProvider(
  "ultra-pro-deckbox",
  ProductCategory.DECK_BOX,
  "Ultra PRO",
);

export const UltimateGuardBinderProvider = brandProvider(
  "ultimate-guard-binder",
  ProductCategory.BINDER,
  "Ultimate Guard",
);
export const VaultXBinderProvider = brandProvider("vault-x-binder", ProductCategory.BINDER, "Vault X");

export const ChessexDiceProvider = brandProvider("chessex-dice", ProductCategory.DICE, "Chessex");

export const UltraProPlaymatProvider = brandProvider(
  "ultra-pro-playmat",
  ProductCategory.PLAYMAT,
  "Ultra PRO",
);

export const PokemonTcgSealedProvider = brandProvider(
  "pokemon-tcg-sealed",
  ProductCategory.SEALED_PRODUCT,
  "Pokémon",
);
export const LorcanaJsonSealedProvider = brandProvider(
  "lorcana-json-sealed",
  ProductCategory.SEALED_PRODUCT,
  "Lorcana",
);
