import { ProductCategory } from "../../domain/enums.js";
import { createManufacturerProvider } from "../_shared/createManufacturerProvider.js";

export const KmcSleevesProvider = createManufacturerProvider({
  providerId: "kmc-sleeves",
  category: ProductCategory.SLEEVES,
  moduleUrl: import.meta.url,
});

export const KmcDeckBoxProvider = createManufacturerProvider({
  providerId: "kmc-deckboxes",
  category: ProductCategory.DECK_BOX,
  moduleUrl: import.meta.url,
});

export const KmcBinderProvider = createManufacturerProvider({
  providerId: "kmc-binders",
  category: ProductCategory.BINDER,
  moduleUrl: import.meta.url,
});

export const KmcPlaymatProvider = createManufacturerProvider({
  providerId: "kmc-playmats",
  category: ProductCategory.PLAYMAT,
  moduleUrl: import.meta.url,
});

export const KmcDiceProvider = createManufacturerProvider({
  providerId: "kmc-dice",
  category: ProductCategory.DICE,
  moduleUrl: import.meta.url,
});

export const KmcCountersProvider = createManufacturerProvider({
  providerId: "kmc-counters",
  category: ProductCategory.COUNTERS,
  moduleUrl: import.meta.url,
});
