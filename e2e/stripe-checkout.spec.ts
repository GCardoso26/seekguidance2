/**
 * E2E Stripe — requer STRIPE_E2E=1, utilizador de teste e Stripe test mode.
 * Executar: npx playwright test e2e/stripe-checkout.spec.ts
 */
import { test, expect } from "@playwright/test";

const RUN_E2E = process.env.STRIPE_E2E === "1";

test.describe("Stripe Checkout E2E", () => {
  test.skip(!RUN_E2E, "Definir STRIPE_E2E=1 para correr testes contra Stripe real");

  test.beforeEach(async ({ page }) => {
    await page.goto("/pricing");
  });

  test("página de pricing mostra planos", async ({ page }) => {
    await expect(page.getByText(/Spike/i).first()).toBeVisible();
    await expect(page.getByText(/Equipe|Jogador Casual/i).first()).toBeVisible();
  });

  test("utilizador não autenticado é redirecionado ao subscrever", async ({ page }) => {
    const proButton = page.getByRole("button", { name: /Virar PRO|Subscrever/i }).first();
    if (await proButton.isVisible()) {
      await proButton.click();
      await page.waitForURL(/\/(judge|login)/);
    }
  });
});
