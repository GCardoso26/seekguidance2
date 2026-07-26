import { ProductCategory } from "../../domain/enums.js";
import { createShopifyAccessoryProvider } from "../_shared/shopifyAccessoryProvider.js";

const HOST = "heavyplay.com";
const BRAND = "Heavy Play";

/** Live Shopify — playmats validated 2026-07-25 (docs/ACCESSORY_IMAGE_PROVIDERS.md). */
export const HeavyPlayPlaymatProvider = createShopifyAccessoryProvider({
  providerId: "heavy-play-playmats",
  host: HOST,
  brandName: BRAND,
  category: ProductCategory.PLAYMAT,
});

export const HeavyPlaySleevesProvider = createShopifyAccessoryProvider({
  providerId: "heavy-play-sleeves",
  host: HOST,
  brandName: BRAND,
  category: ProductCategory.SLEEVES,
});

export const HeavyPlayDeckBoxProvider = createShopifyAccessoryProvider({
  providerId: "heavy-play-deckboxes",
  host: HOST,
  brandName: BRAND,
  category: ProductCategory.DECK_BOX,
});
