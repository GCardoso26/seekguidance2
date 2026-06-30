import type { ShopProduct } from "@/lib/marketplace-shop";
import type { WishlistItem } from "@/types/wishlist";

/** Catálogo determinístico para dev/E2E quando backend não expõe wishlist. */
export const WISHLIST_MOCK_CATALOG: Record<string, ShopProduct> = {
  "wish-mock-1": {
    id: "wish-mock-1",
    name: "Sleeves Dragon Shield Matte",
    category: "sleeve",
    tcg_id: "mtg",
    price_cents: 3490,
    stock: 12,
    store_name: "TCG Arena SP",
    store_slug: "tcg-arena-sp",
    images: ["/logos/mtg.svg"],
    condition: "Novo",
    created_at: "2026-06-01T00:00:00.000Z",
  },
  "wish-mock-2": {
    id: "wish-mock-2",
    name: "Booster Bloomburrow",
    category: "booster",
    tcg_id: "mtg",
    price_cents: 2890,
    stock: 40,
    store_name: "Card House RJ",
    store_slug: "card-house-rj",
    images: ["/logos/mtg.svg"],
    condition: "Selado",
    created_at: "2026-06-10T00:00:00.000Z",
  },
  "wish-mock-3": {
    id: "wish-mock-3",
    name: "Playmat Judge TCG",
    category: "playmat",
    tcg_id: "mtg",
    price_cents: 8990,
    stock: 5,
    store_name: "Judge Store",
    store_slug: "judge-store",
    images: ["/logos/mtg.svg"],
    condition: "Novo",
    created_at: "2026-06-15T00:00:00.000Z",
  },
};

const store = new Map<string, Map<string, WishlistItem>>();

function bucket(userId: string): Map<string, WishlistItem> {
  let b = store.get(userId);
  if (!b) {
    b = new Map();
    store.set(userId, b);
  }
  return b;
}

export function mockWishlistGet(userId: string): WishlistItem[] {
  return Array.from(bucket(userId).values()).sort(
    (a, b) => new Date(b.added_at).getTime() - new Date(a.added_at).getTime(),
  );
}

export function mockWishlistAdd(
  userId: string,
  productId: string,
  product?: ShopProduct,
): WishlistItem | null {
  const catalog = product ?? WISHLIST_MOCK_CATALOG[productId];
  if (!catalog) return null;
  const entry: WishlistItem = {
    product_id: productId,
    added_at: new Date().toISOString(),
    product: catalog,
  };
  bucket(userId).set(productId, entry);
  return entry;
}

export function mockWishlistRemove(userId: string, productId: string): boolean {
  return bucket(userId).delete(productId);
}

export function mockWishlistHas(userId: string, productId: string): boolean {
  return bucket(userId).has(productId);
}
