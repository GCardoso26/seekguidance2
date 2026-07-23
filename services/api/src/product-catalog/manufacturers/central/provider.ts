import { ProductCategory } from "../../domain/enums.js";
import { createManufacturerProvider } from "../_shared/createManufacturerProvider.js";

export const CentralSleevesProvider = createManufacturerProvider({
  providerId: "central-sleeves",
  category: ProductCategory.SLEEVES,
  moduleUrl: import.meta.url,
});

export const CentralDeckBoxProvider = createManufacturerProvider({
  providerId: "central-deckboxes",
  category: ProductCategory.DECK_BOX,
  moduleUrl: import.meta.url,
});

export const CentralBinderProvider = createManufacturerProvider({
  providerId: "central-binders",
  category: ProductCategory.BINDER,
  moduleUrl: import.meta.url,
});

export const CentralPlaymatProvider = createManufacturerProvider({
  providerId: "central-playmats",
  category: ProductCategory.PLAYMAT,
  moduleUrl: import.meta.url,
});

export const CentralDiceProvider = createManufacturerProvider({
  providerId: "central-dice",
  category: ProductCategory.DICE,
  moduleUrl: import.meta.url,
});

export const CentralCountersProvider = createManufacturerProvider({
  providerId: "central-counters",
  category: ProductCategory.COUNTERS,
  moduleUrl: import.meta.url,
});
