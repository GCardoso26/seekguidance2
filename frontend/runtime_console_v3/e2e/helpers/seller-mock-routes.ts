import type { Page } from "@playwright/test";
import {
  sellerGlobalSearchMock,
  sellerHeaderNotificationsMock,
} from "../../src/lib/seller-global-search-mock";
import { dashboardOverviewMock } from "../../src/lib/seller-dashboard-overview-mock";

/** Intercepta BFFs do painel lojista com dados mock (CI sem loja / API vazia). */
export async function mockSellerSprintApis(page: Page) {
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
      body: JSON.stringify(dashboardOverviewMock()),
    });
  });

  await page.route("**/api/stores/mine**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: "e2e-store-1",
          slug: "e2e-test-store",
          name: "E2E Test Store",
          owner_id: "e2e-seller",
        },
      ]),
    });
  });
}
