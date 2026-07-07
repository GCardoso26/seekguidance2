import { test, expect } from "@playwright/test";

test.describe("Marketplace — filtros avançados", () => {
  test("aplica filtro de preço e atualiza URL", async ({ page }) => {
    await page.goto("/marketplace/produtos", { waitUntil: "domcontentloaded" });

    await expect(page.getByTestId("marketplace-search")).toBeVisible({ timeout: 15_000 });

    const desktopFilters = page.getByTestId("marketplace-filters-desktop");
    const mobileOpen = page.getByTestId("marketplace-filters-open");
    const viewport = page.viewportSize();
    const useMobileFilters = viewport != null && viewport.width < 1024;

    if (useMobileFilters) {
      await expect(mobileOpen).toBeVisible({ timeout: 15_000 });
      await mobileOpen.click();
      const drawer = page.getByTestId("marketplace-filters-drawer");
      await expect(drawer).toBeVisible();
      await drawer.getByLabel("Preço mínimo").fill("1");
      await drawer.getByLabel("Preço máximo").fill("500");
      await page.getByTestId("marketplace-filters-apply").click();
    } else {
      await expect(desktopFilters).toBeVisible({ timeout: 15_000 });
      await desktopFilters.getByLabel("Preço mínimo").fill("1");
      await desktopFilters.getByLabel("Preço máximo").fill("500");
    }

    await expect(page).toHaveURL(/min_price=1/, { timeout: 10_000 });
    await expect(page).toHaveURL(/max_price=500/);

    await expect(
      page.getByTestId("marketplace-product-grid").or(page.getByTestId("marketplace-products-empty")),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("mobile: drawer de filtros abre e fecha", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/marketplace/produtos", { waitUntil: "domcontentloaded" });

    const openBtn = page.getByTestId("marketplace-filters-open");
    await expect(openBtn).toBeVisible({ timeout: 15_000 });
    await openBtn.click();

    const drawer = page.getByTestId("marketplace-filters-drawer");
    await expect(drawer).toBeVisible();
    await drawer.getByLabel("Só produtos em estoque").check();
    await expect(page).toHaveURL(/in_stock=true/, { timeout: 15_000 });
    await page.getByTestId("marketplace-filters-apply").click();
    await expect(drawer).toBeHidden({ timeout: 5_000 });
  });
});
