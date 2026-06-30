import type { WishlistItem, WishlistResponse } from "@/types/wishlist";

export const WISHLIST_QUERY_KEY = ["wishlist"] as const;

export function normalizeWishlistResponse(data: unknown): WishlistResponse {
  const raw = data as { items?: unknown[]; total?: number };
  const items = Array.isArray(raw?.items) ? raw.items.filter(isWishlistItem) : [];
  return {
    items,
    total: typeof raw?.total === "number" ? raw.total : items.length,
  };
}

function isWishlistItem(value: unknown): value is WishlistItem {
  if (!value || typeof value !== "object") return false;
  const item = value as WishlistItem;
  return Boolean(item.product_id && item.product && typeof item.product === "object");
}

/** Decide ação de toggle a partir do estado atual. */
export function wishlistToggleAction(isSaved: boolean): "add" | "remove" {
  return isSaved ? "remove" : "add";
}

/** IDs para lookup O(1) no ProductCard. */
export function wishlistIdSet(items: WishlistItem[]): Set<string> {
  return new Set(items.map((i) => i.product_id));
}

export function invalidateWishlistQueryKeys(): readonly (readonly string[])[] {
  return [WISHLIST_QUERY_KEY];
}
