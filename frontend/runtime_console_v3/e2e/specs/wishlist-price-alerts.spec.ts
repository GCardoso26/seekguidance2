import { test as authTest, expect as authExpect } from "../fixtures/auth";
import { test, expect } from "@playwright/test";

const MOCK_PRODUCT = {
  id: "wish-alert-e2e-001",
  name: "E2E Alert Product",
  category: "booster",
  tcg_id: "mtg",
  price_cents: 3000,
  stock: 5,
  store_name: "E2E Store",
  store_slug: "e2e-store",
  images: ["/logos/mtg.svg"],
};

function mockPriceAlertApis(page: import("@playwright/test").Page) {
  let alerts: Array<Record<string, unknown>> = [];
  let notifications: Array<Record<string, unknown>> = [];

  return Promise.all([
    page.route("**/api/wishlist/alerts", async (route) => {
      const method = route.request().method();
      if (method === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ alerts, total: alerts.length }),
        });
        return;
      }
      if (method === "POST") {
        const body = route.request().postDataJSON() as Record<string, unknown>;
        const alert = {
          id: "alert-e2e-1",
          product_id: body.product_id,
          alert_type: body.alert_type ?? "any_drop",
          target_price: body.target_price ?? null,
          percentage: body.percentage ?? null,
          is_active: true,
          created_at: new Date().toISOString(),
          baseline_price_cents: body.baseline_price_cents ?? 3000,
          product: MOCK_PRODUCT,
          current_price_cents: 3000,
        };
        alerts = [alert];
        await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify(alert) });
        return;
      }
      await route.continue();
    }),
    page.route("**/api/wishlist/alerts/alert-e2e-1", async (route) => {
      if (route.request().method() === "DELETE") {
        alerts = [];
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
        return;
      }
      await route.continue();
    }),
    page.route("**/api/wishlist/alerts/simulate-drop", async (route) => {
      const body = route.request().postDataJSON() as { new_price_cents?: number };
      if (alerts[0]) {
        alerts[0] = {
          ...alerts[0],
          last_triggered_at: new Date().toISOString(),
          current_price_cents: body.new_price_cents ?? 2000,
        };
      }
      notifications = [
        {
          id: "notif-price-1",
          type: "price_alert",
          title: "Preço caiu!",
          content: `O preço de ${MOCK_PRODUCT.name} caiu!`,
          link: `/marketplace/product/${MOCK_PRODUCT.id}`,
          readAt: null,
          createdAt: new Date().toISOString(),
          source: "marketplace",
        },
      ];
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ triggered: true, notification: notifications[0] }),
      });
    }),
    page.route("**/api/notifications/feed", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(notifications),
      });
    }),
    page.route("**/api/notifications/unread-count", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ count: notifications.length }),
      });
    }),
    page.route("**/api/account/status", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          player: { account_status: "active", cpf_verified: true, can_purchase: true },
        }),
      });
    }),
    page.route(`**/api/marketplace/shop/products/${MOCK_PRODUCT.id}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ product: MOCK_PRODUCT }),
      });
    }),
  ]);
}

test.describe("Alertas de preço — visitante", () => {
  test("sino redireciona para login", async ({ page }) => {
    await mockPriceAlertApis(page);
    await page.goto(`/marketplace/product/${MOCK_PRODUCT.id}`);
    await page.getByTestId(`price-alert-button-${MOCK_PRODUCT.id}`).click();
    await page.waitForURL(/\/entrar/, { timeout: 15_000 });
  });
});

authTest.describe("Alertas de preço — autenticado", () => {
  authTest.describe.configure({ timeout: 90_000 });

  authTest("produto → configurar alerta → lista", async ({ buyerPage: page }) => {
    await mockPriceAlertApis(page);
    await page.goto(`/marketplace/product/${MOCK_PRODUCT.id}`);
    await authExpect(page.getByTestId(`price-alert-button-${MOCK_PRODUCT.id}`)).toBeVisible({ timeout: 15_000 });
    await page.getByTestId(`price-alert-button-${MOCK_PRODUCT.id}`).click();
    await authExpect(page.getByTestId("price-alert-modal")).toBeVisible();
    await page.getByTestId("price-alert-save").click();
    await page.goto("/wishlist/alerts");
    await authExpect(page.getByTestId("wishlist-alerts-route")).toBeVisible({ timeout: 15_000 });
    await authExpect(page.getByTestId(`price-alert-row-${MOCK_PRODUCT.id}`)).toBeVisible();
  });

  authTest("simular queda → notificação visível", async ({ buyerPage: page }) => {
    await mockPriceAlertApis(page);
    await page.goto(`/marketplace/product/${MOCK_PRODUCT.id}`);
    await page.getByTestId(`price-alert-button-${MOCK_PRODUCT.id}`).click();
    await page.getByTestId("price-alert-save").click();

    await page.evaluate(
      async ({ productId, newPrice }) => {
        await fetch("/api/wishlist/alerts/simulate-drop", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product_id: productId, new_price_cents: newPrice }),
        });
      },
      { productId: MOCK_PRODUCT.id, newPrice: 2000 },
    );

    await page.goto("/wishlist/alerts");
    await authExpect(
      page.getByTestId(`price-alert-triggered-${MOCK_PRODUCT.id}`),
    ).toBeVisible({ timeout: 15_000 });

    await page.goto("/");
    await authExpect(page.getByTestId("notification-bell")).toBeVisible({ timeout: 15_000 });
    await page.getByTestId("notification-bell").hover();
    await authExpect(page.getByText("Preço caiu!").first()).toBeVisible({ timeout: 10_000 });
  });
});
