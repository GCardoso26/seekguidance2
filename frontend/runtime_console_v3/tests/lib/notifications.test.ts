import { describe, expect, it } from "vitest";
import {
  countUnread,
  filterNotifications,
  paginateNotifications,
  parseNotificationsPayload,
} from "@/lib/notifications";
import type { AppNotification } from "@/types/post";

const SAMPLE: AppNotification[] = [
  {
    id: "1",
    type: "price_alert",
    title: "Preço caiu!",
    content: "Produto X",
    readAt: null,
    createdAt: "2026-06-22T10:00:00.000Z",
    source: "marketplace",
  },
  {
    id: "2",
    type: "order_update",
    title: "Pedido enviado",
    readAt: "2026-06-22T11:00:00.000Z",
    createdAt: "2026-06-22T09:00:00.000Z",
    source: "marketplace",
  },
  {
    id: "3",
    type: "xp_earned",
    title: "XP ganho",
    readAt: null,
    createdAt: "2026-06-22T08:00:00.000Z",
  },
];

describe("parseNotificationsPayload", () => {
  it("aceita array direto", () => {
    expect(parseNotificationsPayload(SAMPLE)).toHaveLength(3);
  });

  it("aceita objeto com items", () => {
    expect(parseNotificationsPayload({ items: SAMPLE })).toHaveLength(3);
  });
});

describe("filterNotifications", () => {
  it("filtra não lidas", () => {
    const unread = filterNotifications(SAMPLE, "unread");
    expect(unread).toHaveLength(2);
    expect(unread.every((n) => !n.readAt)).toBe(true);
  });

  it("filtra por tipo", () => {
    expect(filterNotifications(SAMPLE, "price_alert")).toHaveLength(1);
  });
});

describe("countUnread", () => {
  it("conta notificações sem readAt", () => {
    expect(countUnread(SAMPLE)).toBe(2);
  });
});

describe("paginateNotifications", () => {
  it("pagina resultados", () => {
    const { items, total } = paginateNotifications(SAMPLE, 1, 2);
    expect(total).toBe(3);
    expect(items).toHaveLength(2);
  });
});

describe("mock mark read helpers", () => {
  it("wishlist price alert mock marca como lida", async () => {
    const {
      mockPriceAlertCreate,
      mockSimulatePriceDrop,
      mockPriceAlertNotifications,
      mockMarkPriceAlertNotificationRead,
    } = await import("@/lib/wishlist-price-alerts-mock");
    const userId = "test-user-notif-1";
    mockPriceAlertCreate(userId, {
      product_id: "wish-mock-1",
      alert_type: "any_drop",
      target_price: null,
      percentage: null,
      baseline_price_cents: 3490,
    });
    const notif = mockSimulatePriceDrop(userId, "wish-mock-1", 2000);
    expect(notif).toBeTruthy();
    const list = mockPriceAlertNotifications(userId);
    expect(list[0]?.readAt).toBeNull();
    mockMarkPriceAlertNotificationRead(userId, list[0]!.id);
    expect(mockPriceAlertNotifications(userId)[0]?.readAt).toBeTruthy();
  });
});
