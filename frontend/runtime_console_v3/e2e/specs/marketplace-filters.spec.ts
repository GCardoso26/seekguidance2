import { test, expect } from "@playwright/test";

test.describe("Marketplace — filtros avançados", () => {
  test("aplica filtro de preço e atualiza URL", async ({ page }) => {
    await page.goto("/marketplace", { waitUntil: "domcontentloaded" });

    await expect(page.getByTestId("marketplace-search")).toBeVisible({ timeout: 15_000 });

    const desktopFilters = page.getByTestId("marketplace-filters-desktop");
    if (await desktopFilters.isVisible()) {
      await desktopFilters.getByLabel("Preço mínimo").fill("1");
      await desktopFilters.getByLabel("Preço máximo").fill("500");
    } else {
      await page.getByTestId("marketplace-filters-open").click();
      const drawer = page.getByTestId("marketplace-filters-drawer");
      await expect(drawer).toBeVisible();
      await drawer.getByLabel("Preço mínimo").fill("1");
      await drawer.getByLabel("Preço máximo").fill("500");
      await page.getByTestId("marketplace-filters-apply").click();
    }

    await expect(page).toHaveURL(/min_price=1/, { timeout: 10_000 });
    await expect(page).toHaveURL(/max_price=500/);

    await expect(
      page.getByTestId("marketplace-product-grid").or(page.getByTestId("marketplace-products-empty")),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("mobile: drawer de filtros abre e fecha", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/marketplace", { waitUntil: "domcontentloaded" });

    const openBtn = page.getByTestId("marketplace-filters-open");
    await expect(openBtn).toBeVisible({ timeout: 15_000 });
    await openBtn.click();

    const drawer = page.getByTestId("marketplace-filters-drawer");
    await expect(drawer).toBeVisible();
    await drawer.getByLabel("Só produtos em estoque").check();
    await page.getByTestId("marketplace-filters-apply").click();

    await expect(page).toHaveURL(/in_stock=true/, { timeout: 10_000 });
  });
});
