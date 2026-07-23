import { ProductCategory } from "../../domain/enums.js";
import { createManufacturerProvider } from "../_shared/createManufacturerProvider.js";

export const UltimateSleeveSleevesProvider = createManufacturerProvider({
  providerId: "ultimate-sleeve-sleeves",
  category: ProductCategory.SLEEVES,
  moduleUrl: import.meta.url,
});

export const UltimateSleeveDeckBoxProvider = createManufacturerProvider({
  providerId: "ultimate-sleeve-deckboxes",
  category: ProductCategory.DECK_BOX,
  moduleUrl: import.meta.url,
});

export const UltimateSleeveBinderProvider = createManufacturerProvider({
  providerId: "ultimate-sleeve-binders",
  category: ProductCategory.BINDER,
  moduleUrl: import.meta.url,
});

export const UltimateSleevePlaymatProvider = createManufacturerProvider({
  providerId: "ultimate-sleeve-playmats",
  category: ProductCategory.PLAYMAT,
  moduleUrl: import.meta.url,
});

export const UltimateSleeveDiceProvider = createManufacturerProvider({
  providerId: "ultimate-sleeve-dice",
  category: ProductCategory.DICE,
  moduleUrl: import.meta.url,
});

export const UltimateSleeveCountersProvider = createManufacturerProvider({
  providerId: "ultimate-sleeve-counters",
  category: ProductCategory.COUNTERS,
  moduleUrl: import.meta.url,
});
