import { test, expect } from "../fixtures/auth";

test.describe("Authenticated profile", () => {
  test("buyer sees user menu on perfil", async ({ buyerPage: page }) => {
    await page.goto("/perfil");
    await expect(page).toHaveURL(/\/perfil/);
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('[data-testid="profile-skeleton"]')).not.toBeVisible();
  });

  test("buyer profile does not show Mesa de Regras", async ({ buyerPage: page }) => {
    await page.goto("/perfil");
    await expect(page.locator("body")).not.toContainText("Mesa de Regras");
  });
});

test.describe("Seller dashboard", () => {
  test("seller can access painel", async ({ sellerPage: page }) => {
    await page.goto("/vendedor/painel");
    await expect(page).toHaveURL(/\/vendedor\/painel/);
    await expect(page.locator("main, #main-content")).toBeVisible();
  });
});
