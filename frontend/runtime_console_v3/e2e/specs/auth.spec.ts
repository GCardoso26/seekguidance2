import { test, expect } from "@playwright/test";

test.describe("Login page", () => {
  test("entrar page loads with Google CTA", async ({ page }) => {
    await page.goto("/entrar");
    await expect(page).toHaveURL(/\/entrar/);
    await expect(page.getByRole("heading", { name: /Entrar na plataforma/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Continuar com Google/i })).toBeVisible();
  });

  test("header shows Entrar for anonymous users", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('[data-testid="login-submit"]')).toBeVisible();
  });
});
