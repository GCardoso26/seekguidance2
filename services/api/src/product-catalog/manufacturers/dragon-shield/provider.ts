import { ProductCategory } from "../../domain/enums.js";
import { createManufacturerProvider } from "../_shared/createManufacturerProvider.js";

export const DragonShieldSleevesProvider = createManufacturerProvider({
  providerId: "dragon-shield-sleeves",
  category: ProductCategory.SLEEVES,
  moduleUrl: import.meta.url,
});

export const DragonShieldDeckBoxProvider = createManufacturerProvider({
  providerId: "dragon-shield-deckboxes",
  category: ProductCategory.DECK_BOX,
  moduleUrl: import.meta.url,
});

export const DragonShieldBinderProvider = createManufacturerProvider({
  providerId: "dragon-shield-binders",
  category: ProductCategory.BINDER,
  moduleUrl: import.meta.url,
});

export const DragonShieldPlaymatProvider = createManufacturerProvider({
  providerId: "dragon-shield-playmats",
  category: ProductCategory.PLAYMAT,
  moduleUrl: import.meta.url,
});

export const DragonShieldDiceProvider = createManufacturerProvider({
  providerId: "dragon-shield-dice",
  category: ProductCategory.DICE,
  moduleUrl: import.meta.url,
});

export const DragonShieldCountersProvider = createManufacturerProvider({
  providerId: "dragon-shield-counters",
  category: ProductCategory.COUNTERS,
  moduleUrl: import.meta.url,
});
