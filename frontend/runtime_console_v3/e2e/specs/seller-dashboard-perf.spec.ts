import fs from "fs";
import path from "path";
import { test, expect } from "@playwright/test";
import {
  getLifecycleSharedState,
  installLifecycleMocks,
  resetLifecycleSharedState,
} from "../helpers/lifecycle-mocks";
import { measureApiRoundTrip, measureDashboardLoad, PERF_BUDGETS, withApiMetrics } from "../helpers/perf";
import { uniqueLabel } from "../helpers/unique";
import { waitForSellerPanelReady } from "../helpers/wait-panel";

const AUTH = path.join(__dirname, "../.auth/seller.json");
const MANIFEST = path.join(__dirname, "../.seed/run.json");

test.describe("Performance seller", () => {
  test.use({ storageState: AUTH });

  test.beforeAll(() => {
    resetLifecycleSharedState();
    if (fs.existsSync(MANIFEST)) getLifecycleSharedState();
  });

  test.beforeEach(async ({ page }, testInfo) => {
    if (!fs.existsSync(AUTH) || !fs.existsSync(MANIFEST)) {
      testInfo.skip(true, "seed:test + auth setup necessários");
      return;
    }
    await installLifecycleMocks(page);
  });

  test(`dashboard < ${PERF_BUDGETS.dashboardMs}ms (após warm-up)`, async ({ page }) => {
    const ms = await measureDashboardLoad(page);
    expect(ms, `dashboard carregou em ${ms}ms`).toBeLessThan(PERF_BUDGETS.dashboardMs);
  });

  test(`busca API catálogo < ${PERF_BUDGETS.searchApiMs}ms`, async ({ page }) => {
    await page.goto("/vendedor/painel/catalogo/cartas");
    await waitForSellerPanelReady(page);
    let n = 0;
    const apiMs = await measureApiRoundTrip(page, "/api/seller/catalog", async () => {
      n += 1;
      await page.getByTestId("search-card").fill(n === 1 ? "Aa" : "Bolt");
    });
    expect(apiMs, `API busca em ${apiMs}ms`).toBeLessThan(PERF_BUDGETS.searchApiMs);
  });

  test(`cadastro produto < ${PERF_BUDGETS.productCreateMs}ms`, async ({ page }) => {
    await page.goto("/vendedor/painel/catalogo/produtos");
    await waitForSellerPanelReady(page);
    await page.getByTestId("btn-add-product").click();
    const name = uniqueLabel("Perf");
    await page.getByTestId("product-name-input").fill(name);
    await page.getByTestId("product-price-input").fill("11.11");
    await page.getByTestId("product-stock-input").fill("2");
    const { durationMs } = await withApiMetrics(page, "/api/seller/products", async () => {
      await page.getByTestId("save-product").click();
      await expect(page.getByTestId("products-table")).toContainText(name, { timeout: 15_000 });
    });
    expect(durationMs, `cadastro em ${durationMs}ms`).toBeLessThan(PERF_BUDGETS.productCreateMs);
  });
});
