import { test as authTest, expect as authExpect } from "../fixtures/auth";
import { test, expect } from "@playwright/test";

const MOCK_NOTIFICATION = {
  id: "notif-price-e2e-1",
  type: "price_alert",
  title: "Preço caiu!",
  content: "O preço de E2E Alert Product caiu!",
  link: "/marketplace/product/wish-alert-e2e-001",
  readAt: null,
  createdAt: new Date().toISOString(),
  source: "marketplace",
};

function mockNotificationApis(page: import("@playwright/test").Page) {
  let notifications = [MOCK_NOTIFICATION];

  return Promise.all([
    page.route("**/api/notifications/feed", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(notifications),
      });
    }),
    page.route("**/api/notifications/unread-count", async (route) => {
      const unread = notifications.filter((n) => !n.readAt).length;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ count: unread }),
      });
    }),
    page.route("**/api/notifications?**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: notifications,
          total: notifications.length,
          unread: notifications.filter((n) => !n.readAt).length,
          page: 1,
          limit: 50,
        }),
      });
    }),
    page.route("**/api/notifications/*/read**", async (route) => {
      const url = route.request().url();
      const id = url.match(/notifications\/([^/?]+)/)?.[1];
      notifications = notifications.map((n) =>
        n.id === id ? { ...n, readAt: new Date().toISOString() } : n,
      );
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
    }),
    page.route("**/api/wishlist/alerts/simulate-drop", async (route) => {
      notifications = [MOCK_NOTIFICATION];
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ triggered: true, notification: MOCK_NOTIFICATION }),
      });
    }),
  ]);
}

authTest.describe("Notificações (autenticado)", () => {
  authTest.beforeEach(async ({ buyerPage }) => {
    await mockNotificationApis(buyerPage);
  });

  authTest("fluxo 1: sino mostra badge unread", async ({ buyerPage }) => {
    await buyerPage.goto("/");
    await authExpect(buyerPage.getByTestId("notification-bell")).toBeVisible({ timeout: 15000 });
    await authExpect(buyerPage.getByTestId("notification-unread-badge")).toBeVisible();
  });

  authTest("fluxo 2: página /notifications lista alerta de preço", async ({ buyerPage }) => {
    await buyerPage.goto("/notifications");
    await authExpect(buyerPage.getByTestId("notifications-route")).toBeVisible();
    await authExpect(buyerPage.getByTestId("notifications-page")).toBeVisible({ timeout: 15000 });
    await authExpect(buyerPage.getByTestId("notification-row-notif-price-e2e-1")).toBeVisible();
  });
});

test.describe("Notificações (público)", () => {
  test("rota /notifications carrega shell", async ({ page }) => {
    await page.goto("/notifications");
    await expect(page.getByTestId("notifications-route")).toBeVisible({ timeout: 15000 });
  });
});
