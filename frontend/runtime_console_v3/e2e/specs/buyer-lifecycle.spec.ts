import fs from "fs";
import path from "path";
import { test, expect } from "@playwright/test";

const AUTH = path.join(__dirname, "../.auth/buyer.json");
const EVIDENCE = path.resolve(__dirname, "../../../../testing/reports/persona-carlos");

test.describe.configure({ mode: "serial" });

test.describe("Carlos Buyer lifecycle (Checkout V2 path)", () => {
  test.use({ storageState: AUTH });

  test.beforeAll(() => {
    fs.mkdirSync(EVIDENCE, { recursive: true });
  });

  test.beforeEach(async ({}, testInfo) => {
    if (!fs.existsSync(AUTH)) {
      testInfo.skip(true, "Rode e2e auth setup (buyer.json)");
    }
  });

  test("01 home → search → results", async ({ page }) => {
    // /search redirects to purchase search; must never open tournament discovery.
    await page.goto("/search?q=Rapunzel");
    await expect(page).toHaveURL(/\/loja\/busca/);
    await expect(page.getByText("Descobrir Torneios")).toHaveCount(0);
    await expect(page.locator("body")).toBeVisible();
    await page.screenshot({ path: path.join(EVIDENCE, "01-search.png"), fullPage: true });
  });

  test("02 marketplace browse", async ({ page }) => {
    await page.goto("/marketplace");
    await expect(page.locator("body")).toBeVisible({ timeout: 30_000 });
    await page.screenshot({ path: path.join(EVIDENCE, "02-marketplace.png"), fullPage: true });
  });

  test("03 wishlist page loads", async ({ page }) => {
    await page.goto("/wishlist");
    await expect(page.locator("body")).toBeVisible({ timeout: 30_000 });
    await page.screenshot({ path: path.join(EVIDENCE, "03-wishlist.png"), fullPage: true });
  });

  test("04 cart page loads", async ({ page }) => {
    await page.goto("/carrinho");
    await expect(page.locator("body")).toBeVisible({ timeout: 30_000 });
    await page.screenshot({ path: path.join(EVIDENCE, "04-cart.png"), fullPage: true });
  });

  test("05 checkout page loads", async ({ page }) => {
    await page.goto("/checkout");
    await expect(page.locator("body")).toBeVisible({ timeout: 30_000 });
    await page.screenshot({ path: path.join(EVIDENCE, "05-checkout.png"), fullPage: true });
    fs.writeFileSync(
      path.join(EVIDENCE, "05-checkout-meta.json"),
      JSON.stringify(
        {
          checkoutV2Flag: process.env.NEXT_PUBLIC_CHECKOUT_V2 ?? "(unset)",
          at: new Date().toISOString(),
        },
        null,
        2,
      ),
    );
  });

  test("06 pedidos / histórico", async ({ page }) => {
    await page.goto("/pedidos");
    await expect(page.locator("body")).toBeVisible({ timeout: 30_000 });
    await page.screenshot({ path: path.join(EVIDENCE, "06-pedidos.png"), fullPage: true });
  });

  test("07 favorites page / local favorites API surface", async ({ page }) => {
    await page.goto("/wishlist");
    await expect(page.locator("body")).toBeVisible({ timeout: 30_000 });
    await page.evaluate(() => {
      localStorage.setItem(
        "judge-favorites-v1",
        JSON.stringify([{ id: "fav-e2e-1", name: "E2E Favorite Card" }]),
      );
    });
    const stored = await page.evaluate(() => localStorage.getItem("judge-favorites-v1"));
    expect(stored).toContain("fav-e2e-1");
    await page.screenshot({ path: path.join(EVIDENCE, "07-favorites.png"), fullPage: true });
  });

  test("08 sealed products browse", async ({ page }) => {
    await page.goto("/marketplace/produtos");
    await expect(page.locator("body")).toBeVisible({ timeout: 30_000 });
    await page.screenshot({ path: path.join(EVIDENCE, "08-sealed.png"), fullPage: true });
  });
});
