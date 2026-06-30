import { buildSellerCouponsMock } from "@/lib/seller-coupons-mock";
import { couponDisplayStatus, normalizeSellerCoupon, type SellerCouponRow } from "@/types/seller-coupon";

export type SellerCouponsListParams = {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
};

export type SellerCouponsListResponse = {
  coupons: SellerCouponRow[];
  total: number;
  page: number;
  limit: number;
};

const overlayByStore = new Map<string, SellerCouponRow[]>();

function getOverlay(storeId: string): SellerCouponRow[] {
  if (!overlayByStore.has(storeId)) {
    overlayByStore.set(storeId, []);
  }
  return overlayByStore.get(storeId)!;
}

export function mergeCouponsWithOverlay(storeId: string, apiCoupons: SellerCouponRow[]): SellerCouponRow[] {
  const overlay = getOverlay(storeId);
  const apiIds = new Set(apiCoupons.map((c) => c.id));
  const merged = [...apiCoupons];
  for (const item of overlay) {
    const idx = merged.findIndex((c) => c.id === item.id);
    if (idx >= 0) merged[idx] = item;
    else if (!apiIds.has(item.id)) merged.unshift(item);
  }
  return merged.sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });
}

function filterCoupons(
  coupons: SellerCouponRow[],
  status?: string,
  type?: string,
): SellerCouponRow[] {
  let list = coupons;
  if (type === "percentage" || type === "fixed") {
    list = list.filter((c) => c.discountType === type);
  }
  if (status === "active") {
    list = list.filter((c) => couponDisplayStatus(c) === "active");
  } else if (status === "inactive") {
    list = list.filter((c) => couponDisplayStatus(c) === "inactive");
  } else if (status === "expired") {
    list = list.filter((c) => couponDisplayStatus(c) === "expired");
  }
  return list;
}

export function paginateCoupons(
  coupons: SellerCouponRow[],
  page: number,
  limit: number,
): SellerCouponsListResponse {
  const safePage = Math.max(1, page);
  const safeLimit = Math.max(1, Math.min(100, limit));
  const total = coupons.length;
  const start = (safePage - 1) * safeLimit;
  return {
    coupons: coupons.slice(start, start + safeLimit),
    total,
    page: safePage,
    limit: safeLimit,
  };
}

export function listCouponsFromMock(
  storeId: string,
  params: SellerCouponsListParams,
): SellerCouponsListResponse {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const base = buildSellerCouponsMock(storeId);
  const merged = mergeCouponsWithOverlay(storeId, base);
  const filtered = filterCoupons(merged, params.status, params.type);
  return paginateCoupons(filtered, page, limit);
}

export function listCouponsFromApiRows(
  storeId: string,
  rows: Record<string, unknown>[],
  params: SellerCouponsListParams,
): SellerCouponsListResponse {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const normalized = rows.map((row) => normalizeSellerCoupon(row));
  const merged = mergeCouponsWithOverlay(storeId, normalized);
  const filtered = filterCoupons(merged, params.status, params.type);
  return paginateCoupons(filtered, page, limit);
}

export function addCouponToOverlay(storeId: string, row: Record<string, unknown>): SellerCouponRow {
  const coupon = normalizeSellerCoupon(row);
  const overlay = getOverlay(storeId);
  overlay.unshift(coupon);
  return coupon;
}

export function updateCouponInOverlay(
  storeId: string,
  couponId: string,
  patch: Record<string, unknown>,
): SellerCouponRow | null {
  const overlay = getOverlay(storeId);
  const existing =
    overlay.find((c) => c.id === couponId) ??
    buildSellerCouponsMock(storeId).find((c) => c.id === couponId);

  if (!existing) return null;

  const updated = normalizeSellerCoupon({
    id: existing.id,
    code: existing.code,
    type: patch.type ?? existing.discountType,
    value_cents: patch.value_cents ?? existing.valueCents,
    min_order_cents: patch.min_order_cents ?? existing.minOrderCents,
    max_uses: patch.max_uses !== undefined ? patch.max_uses : existing.maxUses,
    current_uses: existing.currentUses,
    is_active: patch.is_active !== undefined ? patch.is_active : existing.isActive,
    expires_at: patch.expires_at !== undefined ? patch.expires_at : existing.expiresAt,
    created_at: existing.createdAt,
  });

  const idx = overlay.findIndex((c) => c.id === couponId);
  if (idx >= 0) overlay[idx] = updated;
  else overlay.push(updated);

  return updated;
}

export function removeCouponFromOverlay(storeId: string, couponId: string): boolean {
  const overlay = getOverlay(storeId);
  const before = overlay.length;
  overlayByStore.set(
    storeId,
    overlay.filter((c) => c.id !== couponId),
  );
  return overlayByStore.get(storeId)!.length < before;
}
