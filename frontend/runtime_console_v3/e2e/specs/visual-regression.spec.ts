import fs from "fs";
import path from "path";
import { test, expect } from "@playwright/test";
import {
  getLifecycleSharedState,
  installLifecycleMocks,
  resetLifecycleSharedState,
} from "../helpers/lifecycle-mocks";
import { waitForSellerPanelReady } from "../helpers/wait-panel";

const AUTH = path.join(__dirname, "../.auth/seller.json");
const MANIFEST = path.join(__dirname, "../.seed/run.json");

/**
 * Regressão visual — baselines em e2e/specs/visual-regression.spec.ts-snapshots/
 * Atualizar: npx playwright test e2e/specs/visual-regression.spec.ts --update-snapshots
 */
test.describe("Regressão visual", () => {
  test.use({
    storageState: AUTH,
    viewport: { width: 1280, height: 720 },
  });

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

  test("dashboard", async ({ page }) => {
    await page.goto("/vendedor/painel");
    await waitForSellerPanelReady(page);
    await expect(page.getByTestId("dashboard-metrics")).toBeVisible({ timeout: 20_000 });
    await expect(page).toHaveScreenshot("seller-dashboard.png", {
      fullPage: false,
      maxDiffPixelRatio: 0.08,
      animations: "disabled",
    });
  });

  test("lista de produtos", async ({ page }) => {
    await page.goto("/vendedor/painel/catalogo/produtos");
    await waitForSellerPanelReady(page);
    await expect(page.getByTestId("products-table")).toBeVisible({ timeout: 20_000 });
    await expect(page).toHaveScreenshot("seller-products.png", {
      fullPage: false,
      maxDiffPixelRatio: 0.08,
      animations: "disabled",
    });
  });

  test("tela de pedido", async ({ page }) => {
    const seed = getLifecycleSharedState();
    const orderId = seed.orders[0]?.id;
    await page.goto(`/vendedor/painel/pedidos?drawer=${encodeURIComponent(orderId!)}`);
    await waitForSellerPanelReady(page);
    await expect(page.getByTestId("order-detail-drawer")).toBeVisible({ timeout: 20_000 });
    await expect(page).toHaveScreenshot("seller-order-drawer.png", {
      fullPage: false,
      maxDiffPixelRatio: 0.1,
      animations: "disabled",
    });
  });

  test("carrinho (marketplace)", async ({ page }) => {
    await page.goto("/carrinho");
    await expect(page.locator("main").first()).toBeVisible({ timeout: 20_000 });
    await expect(page).toHaveScreenshot("cart.png", {
      fullPage: false,
      maxDiffPixelRatio: 0.12,
      animations: "disabled",
    });
  });

  test("checkout", async ({ page }) => {
    await page.goto("/checkout");
    await expect(page.locator("main").or(page.locator("body")).first()).toBeVisible({
      timeout: 20_000,
    });
    await expect(page).toHaveScreenshot("checkout.png", {
      fullPage: false,
      maxDiffPixelRatio: 0.12,
      animations: "disabled",
    });
  });
});
