import { ProductCategory } from "../../domain/enums.js";
import { createManufacturerProvider } from "../_shared/createManufacturerProvider.js";

export const UltraProSleevesProvider = createManufacturerProvider({
  providerId: "ultra-pro-sleeves",
  category: ProductCategory.SLEEVES,
  moduleUrl: import.meta.url,
});

export const UltraProDeckBoxProvider = createManufacturerProvider({
  providerId: "ultra-pro-deckboxes",
  category: ProductCategory.DECK_BOX,
  moduleUrl: import.meta.url,
});

export const UltraProBinderProvider = createManufacturerProvider({
  providerId: "ultra-pro-binders",
  category: ProductCategory.BINDER,
  moduleUrl: import.meta.url,
});

export const UltraProPlaymatProvider = createManufacturerProvider({
  providerId: "ultra-pro-playmats",
  category: ProductCategory.PLAYMAT,
  moduleUrl: import.meta.url,
});

export const UltraProDiceProvider = createManufacturerProvider({
  providerId: "ultra-pro-dice",
  category: ProductCategory.DICE,
  moduleUrl: import.meta.url,
});

export const UltraProCountersProvider = createManufacturerProvider({
  providerId: "ultra-pro-counters",
  category: ProductCategory.COUNTERS,
  moduleUrl: import.meta.url,
});
