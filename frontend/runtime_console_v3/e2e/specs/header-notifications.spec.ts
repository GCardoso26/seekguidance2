import { test, expect } from "@playwright/test";

test.describe("Keyboard shortcuts", () => {
  test("question mark opens shortcuts modal", async ({ page }) => {
    await page.goto("/vendedor/painel");
    await page.keyboard.press("?");
    await expect(page.getByText("Atalhos de teclado")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Busca global")).toBeVisible();
  });
});
