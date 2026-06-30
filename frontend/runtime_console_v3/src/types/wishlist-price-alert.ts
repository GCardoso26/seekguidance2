import type { ShopProduct } from "@/lib/marketplace-shop";

export type PriceAlertType = "any_drop" | "target_price" | "percentage_drop";

export type WishlistPriceAlert = {
  id: string;
  product_id: string;
  target_price: number | null;
  alert_type: PriceAlertType;
  percentage: number | null;
  is_active: boolean;
  created_at: string;
  baseline_price_cents: number;
  product?: ShopProduct;
  current_price_cents?: number;
  last_triggered_at?: string | null;
};

export type WishlistPriceAlertsResponse = {
  alerts: WishlistPriceAlert[];
  total: number;
};
