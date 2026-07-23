import { ProductCategory } from "../../domain/enums.js";
import { createManufacturerProvider } from "../_shared/createManufacturerProvider.js";

export const ArcaneTinmenSleevesProvider = createManufacturerProvider({
  providerId: "arcane-tinmen-sleeves",
  category: ProductCategory.SLEEVES,
  moduleUrl: import.meta.url,
});

export const ArcaneTinmenDeckBoxProvider = createManufacturerProvider({
  providerId: "arcane-tinmen-deckboxes",
  category: ProductCategory.DECK_BOX,
  moduleUrl: import.meta.url,
});

export const ArcaneTinmenBinderProvider = createManufacturerProvider({
  providerId: "arcane-tinmen-binders",
  category: ProductCategory.BINDER,
  moduleUrl: import.meta.url,
});

export const ArcaneTinmenPlaymatProvider = createManufacturerProvider({
  providerId: "arcane-tinmen-playmats",
  category: ProductCategory.PLAYMAT,
  moduleUrl: import.meta.url,
});

export const ArcaneTinmenDiceProvider = createManufacturerProvider({
  providerId: "arcane-tinmen-dice",
  category: ProductCategory.DICE,
  moduleUrl: import.meta.url,
});

export const ArcaneTinmenCountersProvider = createManufacturerProvider({
  providerId: "arcane-tinmen-counters",
  category: ProductCategory.COUNTERS,
  moduleUrl: import.meta.url,
});
