import { normalizeSellerCoupon } from "@/types/seller-coupon";

const now = Date.now();
const day = 24 * 60 * 60 * 1000;

/** Mock determinístico: 1 ativo, 1 inativo, 1 expirado. */
export function buildSellerCouponsMock(storeId: string) {
  const rows = [
    {
      id: `mock-coupon-active-${storeId.slice(0, 8)}`,
      code: "VERAO10",
      type: "percentage",
      value_cents: 10,
      min_order_cents: 5000,
      max_uses: 100,
      current_uses: 12,
      is_active: true,
      expires_at: new Date(now + 30 * day).toISOString(),
      created_at: new Date(now - 10 * day).toISOString(),
    },
    {
      id: `mock-coupon-inactive-${storeId.slice(0, 8)}`,
      code: "OFF15",
      type: "fixed",
      value_cents: 1500,
      min_order_cents: 0,
      max_uses: 50,
      current_uses: 50,
      is_active: false,
      expires_at: null,
      created_at: new Date(now - 60 * day).toISOString(),
    },
    {
      id: `mock-coupon-expired-${storeId.slice(0, 8)}`,
      code: "BLACKFRI",
      type: "percentage",
      value_cents: 20,
      min_order_cents: 10000,
      max_uses: null,
      current_uses: 8,
      is_active: true,
      expires_at: new Date(now - 5 * day).toISOString(),
      created_at: new Date(now - 90 * day).toISOString(),
    },
  ];

  return rows.map((row) => normalizeSellerCoupon(row));
}
