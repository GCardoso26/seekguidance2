import { test, expect } from "@playwright/test";

test.describe("Global search sprint 4", () => {
  test("global search finds orders and customers", async ({ page }) => {
    await page.goto("/vendedor/painel");
    await page.keyboard.press("Control+k");
    await expect(page.getByTestId("seller-global-search-input")).toBeVisible({ timeout: 10_000 });
    await page.getByPlaceholder("Pesquisar...").fill("185");
    await expect(page.getByText("#18555")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("João Silva")).toBeVisible();
  });
});

test.describe("Header notifications sprint 4", () => {
  test("notification bell shows badge and dropdown", async ({ page }) => {
    await page.goto("/vendedor/painel");
    await expect(page.getByTestId("header-notifications-badge")).toHaveText("12", {
      timeout: 15_000,
    });
    await page.getByTestId("header-notifications-bell").click();
    await expect(page.getByText("novos pedidos")).toBeVisible();
  });
});
