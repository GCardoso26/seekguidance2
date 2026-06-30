import type { AppNotification } from "@/types/post";
import {
  mockMarkAllPriceAlertNotificationsRead,
  mockMarkPriceAlertNotificationRead,
  mockDeletePriceAlertNotification,
  mockPriceAlertNotifications,
} from "@/lib/wishlist-price-alerts-mock";

export type PushSubscriptionRecord = {
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
};

const notificationsByUser = new Map<string, AppNotification[]>();
const pushSubsByUser = new Map<string, PushSubscriptionRecord[]>();

function notifBucket(userId: string): AppNotification[] {
  let list = notificationsByUser.get(userId);
  if (!list) {
    list = [];
    notificationsByUser.set(userId, list);
  }
  return list;
}

function pushBucket(userId: string): PushSubscriptionRecord[] {
  let list = pushSubsByUser.get(userId);
  if (!list) {
    list = [];
    pushSubsByUser.set(userId, list);
  }
  return list;
}

export function mockAllNotifications(userId: string): AppNotification[] {
  const priceAlerts = mockPriceAlertNotifications(userId);
  const extra = notifBucket(userId);
  const merged = [...priceAlerts, ...extra];
  return merged.sort(
    (a, b) =>
      new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime(),
  );
}

export function mockAddNotification(userId: string, notification: AppNotification): AppNotification {
  notifBucket(userId).unshift(notification);
  return notification;
}

export function mockMarkNotificationRead(userId: string, id: string): boolean {
  if (mockMarkPriceAlertNotificationRead(userId, id)) return true;
  const list = notifBucket(userId);
  const item = list.find((n) => n.id === id);
  if (!item) return false;
  item.readAt = new Date().toISOString();
  return true;
}

export function mockDeleteNotification(userId: string, id: string): boolean {
  if (mockDeletePriceAlertNotification(userId, id)) return true;
  const list = notifBucket(userId);
  const idx = list.findIndex((n) => n.id === id);
  if (idx < 0) return false;
  list.splice(idx, 1);
  return true;
}

export function mockMarkAllNotificationsRead(userId: string): number {
  mockMarkAllPriceAlertNotificationsRead(userId);
  let count = 0;
  for (const n of notifBucket(userId)) {
    if (!n.readAt) {
      n.readAt = new Date().toISOString();
      count += 1;
    }
  }
  return count;
}

export function mockUnreadCount(userId: string): number {
  return mockAllNotifications(userId).filter((n) => !n.readAt).length;
}

export function mockSubscribePush(
  userId: string,
  sub: { endpoint: string; keys?: { p256dh?: string; auth?: string } },
): PushSubscriptionRecord {
  const record: PushSubscriptionRecord = {
    endpoint: sub.endpoint,
    p256dh: sub.keys?.p256dh ?? "",
    auth: sub.keys?.auth ?? "",
    created_at: new Date().toISOString(),
  };
  const bucket = pushBucket(userId);
  const existing = bucket.findIndex((s) => s.endpoint === record.endpoint);
  if (existing >= 0) bucket[existing] = record;
  else bucket.push(record);
  return record;
}

export function mockUnsubscribePush(userId: string, endpoint: string): boolean {
  const bucket = pushBucket(userId);
  const idx = bucket.findIndex((s) => s.endpoint === endpoint);
  if (idx < 0) return false;
  bucket.splice(idx, 1);
  return true;
}

export function mockPushSubscriptions(userId: string): PushSubscriptionRecord[] {
  return [...pushBucket(userId)];
}

/** Stub de envio push — registra intenção sem web-push npm. */
export function mockQueuePush(
  userId: string,
  payload: { title: string; body: string; url?: string },
): void {
  const subs = pushBucket(userId);
  if (subs.length === 0) return;
  // Em produção: web-push.sendNotification(sub, JSON.stringify(payload))
  void payload;
}
