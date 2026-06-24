import { test, expect } from "@playwright/test";
import { SELECTORS } from "../utils/selectors";

test.describe("Landing Page", () => {
  test("renders hero and main sections", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(SELECTORS.heroTitle)).toBeVisible();
    await expect(page.locator('[data-testid="game-card-mtg"]')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator(SELECTORS.featuredCards)).toBeVisible({ timeout: 15_000 });
    await expect(page.locator(SELECTORS.featuredShops)).toBeVisible({ timeout: 15_000 });
  });

  test("global search shows results", async ({ page }) => {
    await page.goto("/");
    await page.fill(SELECTORS.searchBar, "Lightning");
    await expect(page.locator(SELECTORS.searchResults)).toBeVisible({ timeout: 10_000 });
    expect(await page.locator(SELECTORS.searchResults).locator("a").count()).toBeGreaterThan(0);
  });

  test("game grid navigates to Magic", async ({ page }) => {
    await page.goto("/");
    const magicCard = page.getByRole("link", { name: /Magic/i });
    await expect(magicCard).toBeVisible({ timeout: 15_000 });
    await magicCard.click();
    await expect(page).toHaveURL(/\/loja\/mtg/, { timeout: 15_000 });
  });

  test("responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await expect(page.locator(SELECTORS.heroTitle)).toBeVisible();
  });
});
