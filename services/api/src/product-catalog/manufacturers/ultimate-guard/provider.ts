import { ProductCategory } from "../../domain/enums.js";
import { createManufacturerProvider } from "../_shared/createManufacturerProvider.js";

export const UltimateGuardSleevesProvider = createManufacturerProvider({
  providerId: "ultimate-guard-sleeves",
  category: ProductCategory.SLEEVES,
  moduleUrl: import.meta.url,
});

export const UltimateGuardDeckBoxProvider = createManufacturerProvider({
  providerId: "ultimate-guard-deckboxes",
  category: ProductCategory.DECK_BOX,
  moduleUrl: import.meta.url,
});

export const UltimateGuardBinderProvider = createManufacturerProvider({
  providerId: "ultimate-guard-binders",
  category: ProductCategory.BINDER,
  moduleUrl: import.meta.url,
});

export const UltimateGuardPlaymatProvider = createManufacturerProvider({
  providerId: "ultimate-guard-playmats",
  category: ProductCategory.PLAYMAT,
  moduleUrl: import.meta.url,
});

export const UltimateGuardDiceProvider = createManufacturerProvider({
  providerId: "ultimate-guard-dice",
  category: ProductCategory.DICE,
  moduleUrl: import.meta.url,
});

export const UltimateGuardCountersProvider = createManufacturerProvider({
  providerId: "ultimate-guard-counters",
  category: ProductCategory.COUNTERS,
  moduleUrl: import.meta.url,
});
