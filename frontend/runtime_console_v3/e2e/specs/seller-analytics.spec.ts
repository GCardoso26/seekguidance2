import { test, expect } from "@playwright/test";

test.describe("Seller analytics", () => {
  test("painel exibe métricas públicas do vendedor", async ({ page }) => {
    await page.goto("/seller/cardseekers", { waitUntil: "domcontentloaded" });

    const panel = page.getByTestId("seller-analytics-panel");
    await expect(panel).toBeVisible({ timeout: 15_000 });
    await expect(panel.getByText("1.247")).toBeVisible();
    await expect(panel.getByText("4.8")).toBeVisible();
    await expect(panel.getByText("Entrega Rápida")).toBeVisible();
    await expect(panel.getByText("Top Vendedor")).toBeVisible();
  });

  test("distribuição de ratings e jogos aparecem", async ({ page }) => {
    await page.goto("/seller/cardseekers", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("seller-analytics-panel")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Magic: The Gathering/i)).toBeVisible();
    await expect(page.getByText(/avaliações/i)).toBeVisible();
  });
});
