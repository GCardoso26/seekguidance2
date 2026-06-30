import { test, expect } from "@playwright/test";
import { SELECTORS } from "../utils/selectors";

test.describe("Landing Page", () => {
  test("renders hero and main sections", async ({ page }) => {
    test.setTimeout(90_000);

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator(SELECTORS.heroTitle)).toBeVisible();
    await expect(page.locator('[data-testid="game-card-mtg"]')).toBeVisible({ timeout: 15_000 });

    await page.getByRole("heading", { name: /Tendências de preço/i }).scrollIntoViewIfNeeded();
    await expect(
      page.locator('[data-testid="featured-cards"], [data-testid="featured-cards-loading"]'),
    ).toBeVisible({ timeout: 20_000 });

    await page.getByRole("heading", { name: /Lojas em destaque/i }).scrollIntoViewIfNeeded();
    await expect(
      page.locator('[data-testid="featured-shops"], [data-testid="featured-shops-loading"]'),
    ).toBeVisible({ timeout: 20_000 });
  });

  test("global search shows results", async ({ page }) => {
    await page.goto("/");
    await page.fill(SELECTORS.searchBar, "Lightning");
    await expect(page.locator(SELECTORS.searchResults)).toBeVisible({ timeout: 10_000 });
    expect(await page.locator(SELECTORS.searchResults).locator("a").count()).toBeGreaterThan(0);
  });

  test("game grid navigates to Magic", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const magicCard = page.locator('[data-testid="game-card-mtg"]');
    await expect(magicCard).toBeVisible({ timeout: 15_000 });
    await expect(magicCard).toHaveAttribute("href", "/loja/mtg");
    await magicCard.scrollIntoViewIfNeeded();
    await magicCard.click({ force: true });
    await page.waitForURL(/\/loja\/mtg/, { timeout: 20_000, waitUntil: "domcontentloaded" });
  });

  test("responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await expect(page.locator(SELECTORS.heroTitle)).toBeVisible();
  });
});
