import type { AppNotification } from "@/types/post";

export const NOTIFICATIONS_QUERY_KEY = ["notifications"] as const;
export const NOTIFICATIONS_FEED_KEY = ["notifications-feed"] as const;
export const NOTIFICATIONS_UNREAD_KEY = ["notifications-unread"] as const;

export type NotificationFilter = "all" | "unread" | string;

export type NotificationsListResponse = {
  items: AppNotification[];
  total: number;
  unread: number;
  page: number;
  limit: number;
};

export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  price_alert: "Alertas de preço",
  order_update: "Pedidos",
  tournament_reminder: "Torneios",
  tournament_result: "Torneios",
  xp_earned: "XP",
  badge_unlocked: "Badges",
  message: "Mensagens",
};

export function parseNotificationsPayload(data: unknown): AppNotification[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && "items" in data) {
    const items = (data as { items?: unknown }).items;
    return Array.isArray(items) ? (items as AppNotification[]) : [];
  }
  return [];
}

export function filterNotifications(
  items: AppNotification[],
  filter: NotificationFilter,
): AppNotification[] {
  if (filter === "all") return items;
  if (filter === "unread") return items.filter((n) => !n.readAt);
  return items.filter((n) => n.type === filter);
}

export function countUnread(items: AppNotification[]): number {
  return items.filter((n) => !n.readAt).length;
}

export function paginateNotifications(
  items: AppNotification[],
  page: number,
  limit: number,
): { items: AppNotification[]; total: number } {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(100, Math.max(1, limit));
  const start = (safePage - 1) * safeLimit;
  return {
    items: items.slice(start, start + safeLimit),
    total: items.length,
  };
}
