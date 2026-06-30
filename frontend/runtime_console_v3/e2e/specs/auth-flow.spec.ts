import { test, expect } from "../fixtures/auth";
import { waitForSellerPanelReady } from "../helpers/wait-panel";

test.describe("Authenticated profile", () => {
  test("buyer sees user menu on perfil", async ({ buyerPage: page }) => {
    await page.goto("/perfil");
    await expect(page).toHaveURL(/\/perfil/);
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible({ timeout: 15_000 });
  });

  test("buyer profile does not show Mesa de Regras", async ({ buyerPage: page }) => {
    await page.goto("/perfil");
    await expect(page.locator("body")).not.toContainText("Mesa de Regras");
  });
});

test.describe("Seller dashboard", () => {
  test("seller can access painel", async ({ sellerPage: page }) => {
    test.setTimeout(90_000);
    await page.goto("/vendedor/painel");
    await expect(page).toHaveURL(/\/vendedor\/painel/, { timeout: 30_000 });
    await waitForSellerPanelReady(page, 75_000);
  });
});
