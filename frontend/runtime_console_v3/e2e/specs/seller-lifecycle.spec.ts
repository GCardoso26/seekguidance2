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

/**
 * Ciclo completo:
 * Login → Dashboard → Cadastrar → Editar → Excluir → Estoque → Promoção → Pedido → Status → Relatório
 *
 * Pré-requisito: `npm run seed:test`
 * Pós: `npm run seed:test:cleanup`
 */
test.describe.configure({ mode: "serial" });
test.describe("Seller lifecycle E2E", () => {
  test.use({ storageState: AUTH });

  test.beforeAll(() => {
    resetLifecycleSharedState();
    if (fs.existsSync(MANIFEST)) getLifecycleSharedState();
  });

  test.beforeEach(async ({ page }, testInfo) => {
    if (!fs.existsSync(AUTH)) {
      testInfo.skip(true, "Rode e2e:setup-auth (seller.json)");
      return;
    }
    if (!fs.existsSync(MANIFEST)) {
      testInfo.skip(true, "Rode npm run seed:test");
      return;
    }
    await installLifecycleMocks(page);
  });

  test("01 login → dashboard", async ({ page }) => {
    await page.goto("/vendedor/painel");
    await waitForSellerPanelReady(page);
    await expect(page.getByTestId("dashboard-metrics")).toBeVisible({ timeout: 20_000 });
  });

  test("02 cadastrar produto", async ({ page }) => {
    await page.goto("/vendedor/painel/catalogo/produtos");
    await waitForSellerPanelReady(page);
    await page.getByTestId("btn-add-product").click();
    await expect(page.getByTestId("product-form")).toBeVisible();
    const name = uniqueLabel("Lifecycle Card");
    await page.getByTestId("product-name-input").fill(name);
    await page.getByTestId("product-category-select").selectOption("sleeve");
    await page.getByTestId("product-price-input").fill("29.90");
    await page.getByTestId("product-stock-input").fill("10");
    await page.getByTestId("save-product").click();
    await expect(page.getByTestId("products-table")).toContainText(name, { timeout: 15_000 });
    fs.writeFileSync(path.join(__dirname, "../.seed/last-product-name.txt"), name, "utf8");
  });

  test("03 editar produto", async ({ page }) => {
    await page.goto("/vendedor/painel/catalogo/produtos");
    await waitForSellerPanelReady(page);
    const nameFile = path.join(__dirname, "../.seed/last-product-name.txt");
    const createdName = fs.existsSync(nameFile)
      ? fs.readFileSync(nameFile, "utf8").trim()
      : "";
    const row = createdName
      ? page.locator("tr", { hasText: createdName }).first()
      : page.locator("[data-testid^='product-row-']").first();
    await expect(row).toBeVisible({ timeout: 15_000 });
    await row.getByTestId(/^product-edit-/).click();
    await expect(page.getByTestId("product-form")).toBeVisible();
    const edited = `${createdName || "Produto"} EDIT`;
    await page.getByTestId("product-name-input").fill(edited);
    await page.getByTestId("product-price-input").fill("39.90");
    await page.getByTestId("save-product").click();
    await expect(page.getByTestId("products-table")).toContainText(edited, { timeout: 15_000 });
    fs.writeFileSync(nameFile, edited, "utf8");
  });

  test("04 excluir produto", async ({ page }) => {
    await page.goto("/vendedor/painel/catalogo/produtos");
    await waitForSellerPanelReady(page);
    const nameFile = path.join(__dirname, "../.seed/last-product-name.txt");
    const name = fs.existsSync(nameFile) ? fs.readFileSync(nameFile, "utf8").trim() : "";
    const row = name
      ? page.locator("tr", { hasText: name }).first()
      : page.locator("[data-testid^='product-row-']").first();
    await expect(row).toBeVisible({ timeout: 15_000 });
    page.once("dialog", (d) => d.accept());
    await row.getByTestId(/^product-delete-/).click();
    if (name) {
      await expect(page.getByTestId("products-table")).not.toContainText(name, {
        timeout: 15_000,
      });
    }
  });

  test("05 atualizar estoque", async ({ page }) => {
    await page.goto("/vendedor/painel/estoque");
    await waitForSellerPanelReady(page);
    await expect(page.getByTestId("search-card")).toBeVisible({ timeout: 20_000 });
    const productsTab = page.getByRole("button", { name: /^produtos$/i });
    if ((await productsTab.count()) > 0) await productsTab.click();
    const qtyInput = page.locator("[data-testid^='inventory-qty-input-']").first();
    await expect(qtyInput).toBeVisible({ timeout: 20_000 });
    await qtyInput.fill("42");
    const saveBtn = page.locator("[data-testid^='inventory-qty-save-']").first();
    await saveBtn.click();
    await expect(qtyInput).toHaveValue("42");
  });

  test("06 criar promoção (cupom)", async ({ page }) => {
    await page.goto("/vendedor/painel/cupons");
    await waitForSellerPanelReady(page);
    // Garante loja mockada antes de buscar o botão
    await expect
      .poll(async () => page.getByTestId("coupon-new-btn").count(), { timeout: 25_000 })
      .toBeGreaterThan(0);
    await page.getByTestId("coupon-new-btn").click();
    await expect(page.getByTestId("coupon-create-modal")).toBeVisible();
    const code = `LIFE${Date.now().toString(36).toUpperCase().slice(-5)}`;
    await page.getByTestId("coupon-code-input").fill(code);
    await page.getByTestId("coupon-type-select").selectOption("percentage");
    await page.getByTestId("coupon-value-input").fill("15");
    const future = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    await page.getByTestId("coupon-expires-input").fill(future);
    await page.getByTestId("coupon-submit-btn").click();
    await expect(page.getByText(code)).toBeVisible({ timeout: 20_000 });
  });

  test("07 receber pedido → alterar status", async ({ page }) => {
    const seed = getLifecycleSharedState();
    const orderId = seed.orders[0]?.id;
    expect(orderId).toBeTruthy();
    await page.goto(`/vendedor/painel/pedidos?drawer=${encodeURIComponent(orderId!)}`);
    await waitForSellerPanelReady(page);
    await expect(page.getByTestId("order-detail-drawer")).toBeVisible({ timeout: 20_000 });
    const cmd = page.locator("[data-testid^='fulfillment-cmd-']").first();
    await expect(cmd).toBeVisible({ timeout: 15_000 });
    await cmd.click();
    await expect(page.getByTestId("fulfillment-actions")).toBeVisible();
  });

  test("08 gerar relatório", async ({ page }) => {
    await page.goto("/vendedor/painel/estatisticas");
    await waitForSellerPanelReady(page);
    await expect(page.getByTestId("seller-report")).toBeVisible({ timeout: 20_000 });
  });
});
