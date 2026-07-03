import { test, expect } from "@playwright/test";

test.describe("Seller team sprint 3", () => {
  test("team page shows users and permissions", async ({ page }) => {
    await page.goto("/vendedor/painel/equipe/usuarios");
    await expect(page.getByText("Ana Paula")).toBeVisible({ timeout: 15_000 });
    await page.getByText("Ana Paula").click();
    await expect(page.getByText("Permissões")).toBeVisible();
    await page.getByText("Permissões").click();
    await expect(page.getByText("Pedidos")).toBeVisible();
    await expect(page.getByLabel(/Pedidos.*Visualizar/)).toBeChecked();
  });

  test("team logs page shows audit entries", async ({ page }) => {
    await page.goto("/vendedor/painel/equipe/logs");
    await expect(page.getByText("Logs de auditoria")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("team.invite")).toBeVisible();
  });
});

test.describe("Seller finance sprint 3", () => {
  test("finance page shows revenue chart", async ({ page }) => {
    await page.goto("/vendedor/painel/financeiro/receitas");
    await expect(page.getByText("Receitas")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("finance-revenue-chart")).toBeVisible();
  });

  test("payouts page shows pending balance", async ({ page }) => {
    await page.goto("/vendedor/painel/financeiro/repasses");
    await expect(page.getByText("Repasses")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Pendente")).toBeVisible();
  });
});
