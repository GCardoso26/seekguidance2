import type { Page } from "@playwright/test";
import {
  sellerGlobalSearchMock,
  sellerHeaderNotificationsMock,
} from "../../src/lib/seller-global-search-mock";
import { dashboardOverviewMock } from "../../src/lib/seller-dashboard-overview-mock";
import {
  marceloPersonaDashboardOverviewMock,
  marceloPersonaStoreMineMock,
} from "../../src/lib/seller-persona-marcelo-mock";

type MockMode = "default" | "persona-marcelo";

/** Intercepta BFFs do painel lojista com dados mock (CI sem loja / API vazia). */
export async function mockSellerSprintApis(page: Page, mode: MockMode = "default") {
  const overview =
    mode === "persona-marcelo" ? marceloPersonaDashboardOverviewMock() : dashboardOverviewMock();
  const stores =
    mode === "persona-marcelo"
      ? marceloPersonaStoreMineMock()
      : [
          {
            id: "e2e-store-1",
            slug: "e2e-test-store",
            name: "E2E Test Store",
            owner_id: "e2e-seller",
          },
        ];

  await page.route("**/api/seller/notifications/header**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(sellerHeaderNotificationsMock()),
    });
  });

  await page.route("**/api/seller/search/global**", async (route) => {
    const url = new URL(route.request().url());
    const q = url.searchParams.get("q") ?? "";
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(sellerGlobalSearchMock(q)),
    });
  });

  await page.route("**/api/seller/dashboard/overview**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(overview),
    });
  });

  await page.route("**/api/stores/mine**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(stores),
    });
  });
}

/** Atalho E2E para a persona Premium Marcelo TCG. */
export async function mockMarceloPersonaApis(page: Page) {
  await mockSellerSprintApis(page, "persona-marcelo");
}
