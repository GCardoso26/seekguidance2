import { ProductCategory } from "../../domain/enums.js";
import { createManufacturerProvider } from "../_shared/createManufacturerProvider.js";

export const BandaiAccessoriesSleevesProvider = createManufacturerProvider({
  providerId: "bandai-accessories-sleeves",
  category: ProductCategory.SLEEVES,
  moduleUrl: import.meta.url,
});

export const BandaiAccessoriesDeckBoxProvider = createManufacturerProvider({
  providerId: "bandai-accessories-deckboxes",
  category: ProductCategory.DECK_BOX,
  moduleUrl: import.meta.url,
});

export const BandaiAccessoriesBinderProvider = createManufacturerProvider({
  providerId: "bandai-accessories-binders",
  category: ProductCategory.BINDER,
  moduleUrl: import.meta.url,
});

export const BandaiAccessoriesPlaymatProvider = createManufacturerProvider({
  providerId: "bandai-accessories-playmats",
  category: ProductCategory.PLAYMAT,
  moduleUrl: import.meta.url,
});

export const BandaiAccessoriesDiceProvider = createManufacturerProvider({
  providerId: "bandai-accessories-dice",
  category: ProductCategory.DICE,
  moduleUrl: import.meta.url,
});

export const BandaiAccessoriesCountersProvider = createManufacturerProvider({
  providerId: "bandai-accessories-counters",
  category: ProductCategory.COUNTERS,
  moduleUrl: import.meta.url,
});
