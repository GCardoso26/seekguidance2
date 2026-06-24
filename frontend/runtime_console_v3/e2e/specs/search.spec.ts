import { test, expect } from "@playwright/test";

const main = "#main-content";

test.describe("Search", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/loja/busca", { waitUntil: "domcontentloaded" });
  });

  test("search page loads with results area", async ({ page }) => {
    await expect(page.locator(main)).toBeVisible();
    await expect(page).toHaveURL(/\/loja\/busca/);
  });

  test("search by query param", async ({ page }) => {
    await page.goto("/loja/busca?q=bolt", { waitUntil: "domcontentloaded" });
    await expect(page.locator(main)).toBeVisible();
    await expect(page).toHaveURL(/q=bolt/);
  });
});
