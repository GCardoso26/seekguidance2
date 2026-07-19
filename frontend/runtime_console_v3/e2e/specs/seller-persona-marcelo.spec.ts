import fs from "fs";
import { test, expect } from "@playwright/test";
import { mockMarceloPersonaApis } from "../helpers/seller-mock-routes";
import { PERSONA_EMAIL, PERSONA_STORE_NAME } from "../../src/lib/e2e-persona-marcelo";

const PERSONA_AUTH = "e2e/.auth/seller-persona.json";

/**
 * Smoke da persona Premium Marcelo TCG.
 * Usa mocks de overview/store para CI estável + data-testid do catálogo.
 */
test.describe("Seller persona Marcelo TCG", () => {
  test.use({ storageState: PERSONA_AUTH });

  test.beforeEach(async ({ page }, testInfo) => {
    if (!fs.existsSync(PERSONA_AUTH)) {
      testInfo.skip(true, "seller-persona.json ausente — rode auth.setup com SERVICE_ROLE");
      return;
    }
    await mockMarceloPersonaApis(page);
  });

  test("dashboard carrega métricas da persona", async ({ page }) => {
    await page.goto("/vendedor/painel");
    await expect(page.getByTestId("dashboard-metrics")).toBeVisible({ timeout: 20_000 });
  });

  test("catálogo expõe data-testid de busca e grid", async ({ page }) => {
    await page.goto("/vendedor/painel/catalogo/cartas");
    await expect(page.getByTestId("search-card")).toBeVisible({ timeout: 20_000 });
    await expect(
      page.getByTestId("products-table").or(page.getByText(/Nenhuma carta|Buscando/i)),
    ).toBeVisible();
  });

  test("credenciais e loja persona estão documentadas", async () => {
    expect(PERSONA_EMAIL).toBe("admin@admin.com");
    expect(PERSONA_STORE_NAME).toBe("Marcelo TCG");
  });
});
