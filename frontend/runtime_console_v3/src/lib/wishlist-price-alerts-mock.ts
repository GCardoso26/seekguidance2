import type { AppNotification } from "@/types/post";
import type { ShopProduct } from "@/lib/marketplace-shop";
import { shouldAlert } from "@/lib/wishlist-price-alert";
import { WISHLIST_MOCK_CATALOG } from "@/lib/wishlist-mock";
import type { WishlistPriceAlert } from "@/types/wishlist-price-alert";

type CreateInput = {
  product_id: string;
  alert_type: WishlistPriceAlert["alert_type"];
  target_price: number | null;
  percentage: number | null;
  baseline_price_cents: number;
  is_active?: boolean;
  product?: ShopProduct;
};

const alertsByUser = new Map<string, Map<string, WishlistPriceAlert>>();
const notificationsByUser = new Map<string, AppNotification[]>();
const priceOverrides = new Map<string, number>();

function alertBucket(userId: string): Map<string, WishlistPriceAlert> {
  let b = alertsByUser.get(userId);
  if (!b) {
    b = new Map();
    alertsByUser.set(userId, b);
  }
  return b;
}

function notifBucket(userId: string): AppNotification[] {
  let list = notificationsByUser.get(userId);
  if (!list) {
    list = [];
    notificationsByUser.set(userId, list);
  }
  return list;
}

export function mockGetProductPriceCents(productId: string, fallback?: number): number {
  if (priceOverrides.has(productId)) return priceOverrides.get(productId)!;
  return fallback ?? WISHLIST_MOCK_CATALOG[productId]?.price_cents ?? 0;
}

export function mockSetProductPrice(productId: string, priceCents: number): void {
  priceOverrides.set(productId, priceCents);
}

export function mockPriceAlertsList(userId: string): WishlistPriceAlert[] {
  return Array.from(alertBucket(userId).values())
    .map((a) => ({
      ...a,
      current_price_cents: mockGetProductPriceCents(a.product_id, a.product?.price_cents),
    }))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function mockPriceAlertCreate(userId: string, input: CreateInput): WishlistPriceAlert | null {
  const product = input.product ?? WISHLIST_MOCK_CATALOG[input.product_id];
  if (!product && !input.product) return null;

  const existing = Array.from(alertBucket(userId).values()).find(
    (a) => a.product_id === input.product_id && a.is_active,
  );
  if (existing) {
    return mockPriceAlertUpdate(userId, existing.id, {
      alert_type: input.alert_type,
      target_price: input.target_price,
      percentage: input.percentage,
      baseline_price_cents: input.baseline_price_cents,
      is_active: true,
      product: product ?? input.product,
    });
  }

  const id = `alert-${userId.slice(0, 6)}-${input.product_id}-${Date.now()}`;
  const alert: WishlistPriceAlert = {
    id,
    product_id: input.product_id,
    alert_type: input.alert_type,
    target_price: input.target_price,
    percentage: input.percentage,
    is_active: input.is_active ?? true,
    created_at: new Date().toISOString(),
    baseline_price_cents: input.baseline_price_cents,
    product: product ?? input.product,
    current_price_cents: mockGetProductPriceCents(input.product_id, product?.price_cents),
  };
  alertBucket(userId).set(id, alert);
  return alert;
}

export function mockPriceAlertUpdate(
  userId: string,
  alertId: string,
  patch: Partial<WishlistPriceAlert>,
): WishlistPriceAlert | null {
  const current = alertBucket(userId).get(alertId);
  if (!current) return null;
  const updated: WishlistPriceAlert = {
    ...current,
    ...patch,
    id: current.id,
    product_id: current.product_id,
  };
  alertBucket(userId).set(alertId, updated);
  return updated;
}

export function mockPriceAlertDelete(userId: string, alertId: string): boolean {
  return alertBucket(userId).delete(alertId);
}

export function mockPriceAlertByProduct(userId: string, productId: string): WishlistPriceAlert | undefined {
  return Array.from(alertBucket(userId).values()).find((a) => a.product_id === productId && a.is_active);
}

export function mockSimulatePriceDrop(
  userId: string,
  productId: string,
  newPriceCents: number,
): AppNotification | null {
  const previousPrice = mockGetProductPriceCents(
    productId,
    WISHLIST_MOCK_CATALOG[productId]?.price_cents ?? 0,
  );
  mockSetProductPrice(productId, newPriceCents);
  const product = WISHLIST_MOCK_CATALOG[productId];
  const productName = product?.name ?? "Produto";

  for (const alert of alertBucket(userId).values()) {
    if (alert.product_id !== productId || !alert.is_active) continue;
    const reference = alert.baseline_price_cents || previousPrice;
    if (!shouldAlert(newPriceCents, reference, alert)) continue;

    const notification: AppNotification = {
      id: `price-alert-${alert.id}-${Date.now()}`,
      type: "price_alert",
      title: "Preço caiu!",
      content: `O preço de ${productName} caiu para ${(newPriceCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}!`,
      link: `/marketplace/product/${productId}`,
      readAt: null,
      createdAt: new Date().toISOString(),
      source: "marketplace",
    };
    notifBucket(userId).unshift(notification);
    mockPriceAlertUpdate(userId, alert.id, {
      last_triggered_at: new Date().toISOString(),
      baseline_price_cents: newPriceCents,
    });
    return notification;
  }
  return null;
}

export function mockPriceAlertNotifications(userId: string): AppNotification[] {
  return [...notifBucket(userId)];
}

export function mockMarkPriceAlertNotificationRead(userId: string, id: string): boolean {
  const item = notifBucket(userId).find((n) => n.id === id);
  if (!item) return false;
  item.readAt = new Date().toISOString();
  return true;
}

export function mockDeletePriceAlertNotification(userId: string, id: string): boolean {
  const list = notifBucket(userId);
  const idx = list.findIndex((n) => n.id === id);
  if (idx < 0) return false;
  list.splice(idx, 1);
  return true;
}

export function mockMarkAllPriceAlertNotificationsRead(userId: string): void {
  for (const n of notifBucket(userId)) {
    if (!n.readAt) n.readAt = new Date().toISOString();
  }
}
