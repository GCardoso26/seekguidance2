import { ProductCategory } from "../../domain/enums.js";
import { createShopifyAccessoryProvider } from "../_shared/shopifyAccessoryProvider.js";

const HOST = "www.dragonshield.com";
const BRAND = "Dragon Shield";

/** Live Shopify packshots — docs/ACCESSORY_IMAGE_PROVIDERS.md */
export const DragonShieldSleevesProvider = createShopifyAccessoryProvider({
  providerId: "dragon-shield-sleeves",
  host: HOST,
  brandName: BRAND,
  category: ProductCategory.SLEEVES,
});

export const DragonShieldDeckBoxProvider = createShopifyAccessoryProvider({
  providerId: "dragon-shield-deckboxes",
  host: HOST,
  brandName: BRAND,
  category: ProductCategory.DECK_BOX,
});

export const DragonShieldBinderProvider = createShopifyAccessoryProvider({
  providerId: "dragon-shield-binders",
  host: HOST,
  brandName: BRAND,
  category: ProductCategory.BINDER,
});

export const DragonShieldPlaymatProvider = createShopifyAccessoryProvider({
  providerId: "dragon-shield-playmats",
  host: HOST,
  brandName: BRAND,
  category: ProductCategory.PLAYMAT,
});

export const DragonShieldDiceProvider = createShopifyAccessoryProvider({
  providerId: "dragon-shield-dice",
  host: HOST,
  brandName: BRAND,
  category: ProductCategory.DICE,
});

export const DragonShieldCountersProvider = createShopifyAccessoryProvider({
  providerId: "dragon-shield-counters",
  host: HOST,
  brandName: BRAND,
  category: ProductCategory.COUNTERS,
});
