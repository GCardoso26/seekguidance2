import fs from "fs";
import path from "path";
import { test, expect } from "@playwright/test";
import {
  getLifecycleSharedState,
  installLifecycleMocks,
  resetLifecycleSharedState,
} from "../helpers/lifecycle-mocks";
import { uniqueCouponCode, uniqueLabel } from "../helpers/unique";
import { waitForSellerPanelReady } from "../helpers/wait-panel";

const AUTH = path.join(__dirname, "../.auth/seller.json");
const MANIFEST = path.join(__dirname, "../.seed/run.json");

test.describe("Fluxos negativos", () => {
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

  test("login com senha incorreta", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto("/entrar");
    await page.getByPlaceholder(/e-mail/i).fill("test-seller@judgetcg.com");
    await page.getByPlaceholder(/senha/i).fill("SenhaErrada123!");
    await page.getByRole("button", { name: /entrar com e-mail/i }).click();
    await expect(page.getByRole("alert")).toBeVisible({ timeout: 20_000 });
    await expect(page).toHaveURL(/\/entrar/);
    await ctx.close();
  });

  test("produto sem nome (HTML required)", async ({ page }) => {
    await page.goto("/vendedor/painel/catalogo/produtos");
    await waitForSellerPanelReady(page);
    await page.getByTestId("btn-add-product").click();
    await page.getByTestId("product-price-input").fill("10");
    await page.getByTestId("save-product").click();
    const nameInput = page.getByTestId("product-name-input");
    const valid = await nameInput.evaluate((el: HTMLInputElement) => el.checkValidity());
    expect(valid).toBe(false);
  });

  test("produto com preço negativo", async ({ page }) => {
    await page.goto("/vendedor/painel/catalogo/produtos");
    await waitForSellerPanelReady(page);
    await page.getByTestId("btn-add-product").click();
    await page.getByTestId("product-name-input").fill(uniqueLabel("Neg Preço"));
    await page.getByTestId("product-price-input").fill("-5");
    await page.getByTestId("product-stock-input").fill("1");
    await page.getByTestId("save-product").click();
    const htmlBlocked = await page
      .getByTestId("product-price-input")
      .evaluate((el: HTMLInputElement) => !el.checkValidity());
    if (!htmlBlocked) {
      await expect(page.getByText(/preço inválido/i)).toBeVisible({ timeout: 10_000 });
    } else {
      expect(htmlBlocked).toBe(true);
    }
  });

  test("estoque negativo no cadastro", async ({ page }) => {
    await page.goto("/vendedor/painel/catalogo/produtos");
    await waitForSellerPanelReady(page);
    await page.getByTestId("btn-add-product").click();
    await page.getByTestId("product-name-input").fill(uniqueLabel("Neg Estoque"));
    await page.getByTestId("product-price-input").fill("9.90");
    await page.getByTestId("product-stock-input").fill("-3");
    await page.getByTestId("save-product").click();
    const htmlBlocked = await page
      .getByTestId("product-stock-input")
      .evaluate((el: HTMLInputElement) => !el.checkValidity());
    if (!htmlBlocked) {
      await expect(page.getByText(/estoque inválido/i)).toBeVisible({ timeout: 10_000 });
    } else {
      expect(htmlBlocked).toBe(true);
    }
  });

  test("cupom expirado via API", async ({ page }) => {
    await page.goto("/vendedor/painel/cupons");
    await waitForSellerPanelReady(page);
    await expect
      .poll(async () => page.getByTestId("coupon-new-btn").count(), { timeout: 25_000 })
      .toBeGreaterThan(0);
    const storeId = await page.evaluate(async () => {
      const res = await fetch("/api/stores/mine");
      const stores = (await res.json()) as Array<{ id: string }>;
      return stores[0]?.id ?? "";
    });
    expect(storeId).toBeTruthy();
    const status = await page.evaluate(async (sid) => {
      const res = await fetch(`/api/marketplace/shop/stores/${encodeURIComponent(sid)}/coupons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: "EXPIRED1",
          type: "percentage",
          value_cents: 10,
          expires_at: "2020-01-01T00:00:00.000Z",
          is_active: true,
        }),
      });
      return res.status;
    }, storeId);
    expect(status).toBe(400);
  });

  test("cupom duplicado via API", async ({ page }) => {
    await page.goto("/vendedor/painel/cupons");
    await waitForSellerPanelReady(page);
    await expect
      .poll(async () => page.getByTestId("coupon-new-btn").count(), { timeout: 25_000 })
      .toBeGreaterThan(0);
    const storeId = await page.evaluate(async () => {
      const res = await fetch("/api/stores/mine");
      const stores = (await res.json()) as Array<{ id: string }>;
      return stores[0]?.id ?? "";
    });
    const code = uniqueCouponCode("DUP");
    const payload = {
      code,
      type: "percentage",
      value_cents: 10,
      expires_at: new Date(Date.now() + 14 * 864e5).toISOString(),
      is_active: true,
    };
    const first = await page.evaluate(async ({ sid, body }) => {
      const res = await fetch(`/api/marketplace/shop/stores/${encodeURIComponent(sid)}/coupons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return res.status;
    }, { sid: storeId, body: payload });
    expect(first).toBe(201);
    const second = await page.evaluate(async ({ sid, body }) => {
      const res = await fetch(`/api/marketplace/shop/stores/${encodeURIComponent(sid)}/coupons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return res.status;
    }, { sid: storeId, body: payload });
    expect(second).toBe(409);
  });

  test("pedido inexistente", async ({ page }) => {
    await page.goto("/vendedor/painel/pedidos?drawer=order-does-not-exist-e2e");
    await waitForSellerPanelReady(page);
    await expect(page.getByTestId("order-detail-drawer")).toBeVisible({ timeout: 20_000 });
    const status = await page.evaluate(async () => {
      const res = await fetch("/api/seller/orders/order-does-not-exist-e2e");
      return res.status;
    });
    expect(status).toBe(404);
    await expect(page.locator("body")).not.toContainText("Unhandled");
  });

  test("produto já excluído (DELETE 404)", async ({ page }) => {
    await page.goto("/vendedor/painel/catalogo/produtos");
    await waitForSellerPanelReady(page);
    const phantomId = "already-deleted-product-id";
    const status = await page.evaluate(async (id) => {
      const res = await fetch(`/api/seller/products/${encodeURIComponent(id)}`, { method: "DELETE" });
      return res.status;
    }, phantomId);
    expect(status).toBe(404);
  });
});
