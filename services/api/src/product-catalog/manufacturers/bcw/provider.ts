import { ProductCategory } from "../../domain/enums.js";
import { createManufacturerProvider } from "../_shared/createManufacturerProvider.js";

export const BcwSleevesProvider = createManufacturerProvider({
  providerId: "bcw-sleeves",
  category: ProductCategory.SLEEVES,
  moduleUrl: import.meta.url,
});

export const BcwDeckBoxProvider = createManufacturerProvider({
  providerId: "bcw-deckboxes",
  category: ProductCategory.DECK_BOX,
  moduleUrl: import.meta.url,
});

export const BcwBinderProvider = createManufacturerProvider({
  providerId: "bcw-binders",
  category: ProductCategory.BINDER,
  moduleUrl: import.meta.url,
});

export const BcwPlaymatProvider = createManufacturerProvider({
  providerId: "bcw-playmats",
  category: ProductCategory.PLAYMAT,
  moduleUrl: import.meta.url,
});

export const BcwDiceProvider = createManufacturerProvider({
  providerId: "bcw-dice",
  category: ProductCategory.DICE,
  moduleUrl: import.meta.url,
});

export const BcwCountersProvider = createManufacturerProvider({
  providerId: "bcw-counters",
  category: ProductCategory.COUNTERS,
  moduleUrl: import.meta.url,
});
