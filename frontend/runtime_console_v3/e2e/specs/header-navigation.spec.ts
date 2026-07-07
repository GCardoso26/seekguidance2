import { test, expect } from "@playwright/test";

test.describe("Header navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
  });

  test("exibe Comprar, Vender e Trocar", async ({ page }) => {
    await expect(page.getByTestId("nav-buy")).toBeVisible();
    await expect(page.getByTestId("nav-sell")).toBeVisible();
    await expect(page.getByTestId("nav-trade")).toBeVisible();
  });

  test("Comprar navega para a Loja", async ({ page }) => {
    await page.getByTestId("nav-buy").click();
    await expect(page).toHaveURL(/\/loja/);
  });

  test("game picker abre grid de jogos", async ({ page }) => {
    await page.getByTestId("header-game-picker").click();
    await expect(page.getByRole("link", { name: /Magic|Lorcana|Pokémon/i }).first()).toBeVisible();
  });
});
