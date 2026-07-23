import { ProductCategory } from "../../domain/enums.js";
import { createManufacturerProvider } from "../_shared/createManufacturerProvider.js";

export const BushiroadSleevesProvider = createManufacturerProvider({
  providerId: "bushiroad-sleeves",
  category: ProductCategory.SLEEVES,
  moduleUrl: import.meta.url,
});

export const BushiroadDeckBoxProvider = createManufacturerProvider({
  providerId: "bushiroad-deckboxes",
  category: ProductCategory.DECK_BOX,
  moduleUrl: import.meta.url,
});

export const BushiroadBinderProvider = createManufacturerProvider({
  providerId: "bushiroad-binders",
  category: ProductCategory.BINDER,
  moduleUrl: import.meta.url,
});

export const BushiroadPlaymatProvider = createManufacturerProvider({
  providerId: "bushiroad-playmats",
  category: ProductCategory.PLAYMAT,
  moduleUrl: import.meta.url,
});

export const BushiroadDiceProvider = createManufacturerProvider({
  providerId: "bushiroad-dice",
  category: ProductCategory.DICE,
  moduleUrl: import.meta.url,
});

export const BushiroadCountersProvider = createManufacturerProvider({
  providerId: "bushiroad-counters",
  category: ProductCategory.COUNTERS,
  moduleUrl: import.meta.url,
});
