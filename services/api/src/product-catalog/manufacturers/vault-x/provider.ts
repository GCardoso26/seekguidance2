import { ProductCategory } from "../../domain/enums.js";
import { createManufacturerProvider } from "../_shared/createManufacturerProvider.js";

export const VaultXSleevesProvider = createManufacturerProvider({
  providerId: "vault-x-sleeves",
  category: ProductCategory.SLEEVES,
  moduleUrl: import.meta.url,
});

export const VaultXDeckBoxProvider = createManufacturerProvider({
  providerId: "vault-x-deckboxes",
  category: ProductCategory.DECK_BOX,
  moduleUrl: import.meta.url,
});

export const VaultXBinderProvider = createManufacturerProvider({
  providerId: "vault-x-binders",
  category: ProductCategory.BINDER,
  moduleUrl: import.meta.url,
});

export const VaultXPlaymatProvider = createManufacturerProvider({
  providerId: "vault-x-playmats",
  category: ProductCategory.PLAYMAT,
  moduleUrl: import.meta.url,
});

export const VaultXDiceProvider = createManufacturerProvider({
  providerId: "vault-x-dice",
  category: ProductCategory.DICE,
  moduleUrl: import.meta.url,
});

export const VaultXCountersProvider = createManufacturerProvider({
  providerId: "vault-x-counters",
  category: ProductCategory.COUNTERS,
  moduleUrl: import.meta.url,
});
