import { test, expect } from "@playwright/test";

test.describe("Seller profile", () => {
  test("perfil público /seller/cardseekers", async ({ page }) => {
    await page.goto("/seller/cardseekers", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Card Seekers/i })).toBeVisible();
    await expect(page.getByText(/Sol Ring|Lightning Bolt|produto/i).first()).toBeVisible();
  });

  test("username inválido retorna 404", async ({ page }) => {
    const res = await page.goto("/seller/nao-existe-xyz", { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBe(404);
  });
});
