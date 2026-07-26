import { ProductCategory } from "../../domain/enums.js";
import { createShopifyAccessoryProvider } from "../_shared/shopifyAccessoryProvider.js";

const HOST = "ultrapro.com";
const BRAND = "Ultra Pro";

/** Live Shopify packshots — docs/ACCESSORY_IMAGE_PROVIDERS.md */
export const UltraProSleevesProvider = createShopifyAccessoryProvider({
  providerId: "ultra-pro-sleeves",
  host: HOST,
  brandName: BRAND,
  category: ProductCategory.SLEEVES,
});

export const UltraProDeckBoxProvider = createShopifyAccessoryProvider({
  providerId: "ultra-pro-deckboxes",
  host: HOST,
  brandName: BRAND,
  category: ProductCategory.DECK_BOX,
});

export const UltraProBinderProvider = createShopifyAccessoryProvider({
  providerId: "ultra-pro-binders",
  host: HOST,
  brandName: BRAND,
  category: ProductCategory.BINDER,
});

export const UltraProPlaymatProvider = createShopifyAccessoryProvider({
  providerId: "ultra-pro-playmats",
  host: HOST,
  brandName: BRAND,
  category: ProductCategory.PLAYMAT,
});

export const UltraProDiceProvider = createShopifyAccessoryProvider({
  providerId: "ultra-pro-dice",
  host: HOST,
  brandName: BRAND,
  category: ProductCategory.DICE,
});

export const UltraProCountersProvider = createShopifyAccessoryProvider({
  providerId: "ultra-pro-counters",
  host: HOST,
  brandName: BRAND,
  category: ProductCategory.COUNTERS,
});
