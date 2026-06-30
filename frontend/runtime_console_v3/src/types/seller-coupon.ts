export type SellerCouponDiscountType = "percentage" | "fixed";

export type SellerCouponStatus = "active" | "inactive" | "expired";

export type SellerCouponRow = {
  id: string;
  code: string;
  discountType: SellerCouponDiscountType;
  valueCents: number;
  minOrderCents: number;
  maxUses: number | null;
  currentUses: number;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string | null;
};

export function couponDisplayStatus(row: SellerCouponRow): SellerCouponStatus {
  if (!row.isActive) return "inactive";
  if (row.expiresAt) {
    const exp = new Date(row.expiresAt);
    if (!Number.isNaN(exp.getTime()) && exp.getTime() < Date.now()) return "expired";
  }
  if (row.maxUses != null && row.currentUses >= row.maxUses) return "inactive";
  return "active";
}

export function normalizeSellerCoupon(row: Record<string, unknown>): SellerCouponRow {
  const type = String(row.type ?? row.discount_type ?? "percentage");
  return {
    id: String(row.id ?? ""),
    code: String(row.code ?? "").toUpperCase(),
    discountType: type === "fixed" ? "fixed" : "percentage",
    valueCents: Number(row.value_cents ?? 0),
    minOrderCents: Number(row.min_order_cents ?? 0),
    maxUses: row.max_uses == null ? null : Number(row.max_uses),
    currentUses: Number(row.current_uses ?? 0),
    isActive: row.is_active !== false,
    expiresAt: row.expires_at ? String(row.expires_at) : null,
    createdAt: row.created_at ? String(row.created_at) : null,
  };
}

export function formatCouponDiscount(row: SellerCouponRow): string {
  if (row.discountType === "percentage") return `${row.valueCents}%`;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    row.valueCents / 100,
  );
}
