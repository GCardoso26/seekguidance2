/**
 * Seller funnel timing — UX metrics only (no domain rules).
 * KPI: shop_created → first listing published (P50 < 60s).
 */

const SHOP_CREATED_AT = "judgetcg.sellerShopCreatedAtMs";
const SELLER_ID = "judgetcg.sellerId";
const FIRST_LISTING_DONE = "judgetcg.sellerFirstListingDone";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof sessionStorage !== "undefined";
}

export function persistSellerId(sellerId: string): void {
  if (!canUseStorage()) return;
  sessionStorage.setItem(SELLER_ID, sellerId);
}

export function getPersistedSellerId(): string | null {
  if (!canUseStorage()) return null;
  return sessionStorage.getItem(SELLER_ID);
}

export function markShopCreated(sellerId: string, atMs = Date.now()): void {
  if (!canUseStorage()) return;
  persistSellerId(sellerId);
  if (!sessionStorage.getItem(SHOP_CREATED_AT)) {
    sessionStorage.setItem(SHOP_CREATED_AT, String(atMs));
  }
}

export function getShopCreatedAtMs(): number | null {
  if (!canUseStorage()) return null;
  const raw = sessionStorage.getItem(SHOP_CREATED_AT);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function measureTimeToFirstListingMs(nowMs = Date.now()): number | null {
  if (!canUseStorage()) return null;
  if (sessionStorage.getItem(FIRST_LISTING_DONE)) return null;
  const start = getShopCreatedAtMs();
  if (start == null) return null;
  sessionStorage.setItem(FIRST_LISTING_DONE, "1");
  return Math.max(0, nowMs - start);
}

export function clearSellerFunnel(): void {
  if (!canUseStorage()) return;
  sessionStorage.removeItem(SHOP_CREATED_AT);
  sessionStorage.removeItem(SELLER_ID);
  sessionStorage.removeItem(FIRST_LISTING_DONE);
}
