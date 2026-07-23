import { ProductCategory } from "../../domain/enums.js";
import { createManufacturerProvider } from "../_shared/createManufacturerProvider.js";

export const GamegenicSleevesProvider = createManufacturerProvider({
  providerId: "gamegenic-sleeves",
  category: ProductCategory.SLEEVES,
  moduleUrl: import.meta.url,
});

export const GamegenicDeckBoxProvider = createManufacturerProvider({
  providerId: "gamegenic-deckboxes",
  category: ProductCategory.DECK_BOX,
  moduleUrl: import.meta.url,
});

export const GamegenicBinderProvider = createManufacturerProvider({
  providerId: "gamegenic-binders",
  category: ProductCategory.BINDER,
  moduleUrl: import.meta.url,
});

export const GamegenicPlaymatProvider = createManufacturerProvider({
  providerId: "gamegenic-playmats",
  category: ProductCategory.PLAYMAT,
  moduleUrl: import.meta.url,
});

export const GamegenicDiceProvider = createManufacturerProvider({
  providerId: "gamegenic-dice",
  category: ProductCategory.DICE,
  moduleUrl: import.meta.url,
});

export const GamegenicCountersProvider = createManufacturerProvider({
  providerId: "gamegenic-counters",
  category: ProductCategory.COUNTERS,
  moduleUrl: import.meta.url,
});
