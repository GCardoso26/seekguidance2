import type { ShopProduct } from "@/lib/marketplace-shop";

export type WishlistItem = {
  product_id: string;
  added_at: string;
  product: ShopProduct;
};

export type WishlistResponse = {
  items: WishlistItem[];
  total: number;
};
