import fs from "fs";
import path from "path";
import { test, expect } from "@playwright/test";
import {
  getLifecycleSharedState,
  installLifecycleMocks,
  resetLifecycleSharedState,
} from "../helpers/lifecycle-mocks";
import { uniqueLabel } from "../helpers/unique";
import { waitForSellerPanelReady } from "../helpers/wait-panel";

const AUTH = path.join(__dirname, "../.auth/seller.json");
const MANIFEST = path.join(__dirname, "../.seed/run.json");

test.describe("Casos de borda — produtos", () => {
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

  async function createProduct(
    page: import("@playwright/test").Page,
    opts: { name: string; price: string; stock: string },
  ) {
    await page.goto("/vendedor/painel/catalogo/produtos");
    await waitForSellerPanelReady(page);
    await page.getByTestId("btn-add-product").click();
    await page.getByTestId("product-name-input").fill(opts.name);
    await page.getByTestId("product-category-select").selectOption("sleeve");
    await page.getByTestId("product-price-input").fill(opts.price);
    await page.getByTestId("product-stock-input").fill(opts.stock);
    await page.getByTestId("save-product").click();
  }

  test("estoque zero", async ({ page }) => {
    const name = uniqueLabel("Zero Stock");
    await createProduct(page, { name, price: "12.50", stock: "0" });
    await expect(page.getByTestId("products-table")).toContainText(name, { timeout: 15_000 });
    await expect(page.locator("tr", { hasText: name })).toContainText("0");
  });

  test("preço R$ 0,01", async ({ page }) => {
    const name = uniqueLabel("Centavo");
    await createProduct(page, { name, price: "0.01", stock: "5" });
    await expect(page.getByTestId("products-table")).toContainText(name, { timeout: 15_000 });
  });

  test("produto muito caro", async ({ page }) => {
    const name = uniqueLabel("UltraCaro");
    await createProduct(page, { name, price: "99999.99", stock: "1" });
    await expect(page.getByTestId("products-table")).toContainText(name, { timeout: 15_000 });
  });

  test("nome com 255 caracteres", async ({ page }) => {
    const name = `N255-${"あ".repeat(250)}`.slice(0, 255);
    await createProduct(page, { name, price: "3.50", stock: "2" });
    await expect(page.getByTestId("products-table")).toContainText(name.slice(0, 40), {
      timeout: 15_000,
    });
  });

  test("caracteres especiais + emoji + UTF-8", async ({ page }) => {
    const name = uniqueLabel("Esp™ <script>& \"quotes\" 🐉 日本語");
    await createProduct(page, { name, price: "7.77", stock: "3" });
    await expect(page.getByTestId("products-table")).toContainText("🐉", { timeout: 15_000 });
    await expect(page.getByTestId("products-table")).toContainText("日本語");
  });
});
