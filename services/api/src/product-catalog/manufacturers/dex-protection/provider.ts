import { ProductCategory } from "../../domain/enums.js";
import { createManufacturerProvider } from "../_shared/createManufacturerProvider.js";

export const DexProtectionSleevesProvider = createManufacturerProvider({
  providerId: "dex-protection-sleeves",
  category: ProductCategory.SLEEVES,
  moduleUrl: import.meta.url,
});

export const DexProtectionDeckBoxProvider = createManufacturerProvider({
  providerId: "dex-protection-deckboxes",
  category: ProductCategory.DECK_BOX,
  moduleUrl: import.meta.url,
});

export const DexProtectionBinderProvider = createManufacturerProvider({
  providerId: "dex-protection-binders",
  category: ProductCategory.BINDER,
  moduleUrl: import.meta.url,
});

export const DexProtectionPlaymatProvider = createManufacturerProvider({
  providerId: "dex-protection-playmats",
  category: ProductCategory.PLAYMAT,
  moduleUrl: import.meta.url,
});

export const DexProtectionDiceProvider = createManufacturerProvider({
  providerId: "dex-protection-dice",
  category: ProductCategory.DICE,
  moduleUrl: import.meta.url,
});

export const DexProtectionCountersProvider = createManufacturerProvider({
  providerId: "dex-protection-counters",
  category: ProductCategory.COUNTERS,
  moduleUrl: import.meta.url,
});
