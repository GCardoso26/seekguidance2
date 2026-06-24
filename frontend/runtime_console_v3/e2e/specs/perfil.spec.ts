import { test, expect } from "@playwright/test";

test.describe("Profile Pages", () => {
  test("perfil loads without Mesa de Regras redirect", async ({ page }) => {
    await page.goto("/perfil");
    await expect(page).toHaveURL(/\/perfil/);
    await expect(page.locator("body")).not.toContainText("Mesa de Regras");
  });

  test("perfil pedidos redirects to orders", async ({ page }) => {
    await page.goto("/perfil/pedidos");
    await expect(page).toHaveURL(/\/marketplace\/orders/);
  });
});
