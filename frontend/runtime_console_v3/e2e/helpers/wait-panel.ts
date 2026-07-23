import { expect, type Page } from "@playwright/test";

/**
 * Aguarda o layout do painel sair do loading e exibir conteúdo real.
 * NÃO considera "Carregando painel…" como ready (bug histórico).
 */
export async function waitForSellerPanelReady(page: Page, timeout = 60_000) {
  const loading = page.getByText(/carregando painel|atualizando status do cadastro/i);
  await expect(loading).toHaveCount(0, { timeout }).catch(() => {
    /* loading may never appear — continue to content wait */
  });

  // If still stuck on loading after timeout window, fail with clear signal
  const stillLoading = await loading.count();
  if (stillLoading > 0) {
    throw new Error("seller_panel_stuck_loading");
  }

  // Mobile layouts may clip/hide the desktop search trigger (CSS overflow) while
  // the node remains in the DOM — prefer attached + any visible panel signal.
  const ready = page
    .getByTestId("dashboard-metrics")
    .or(page.getByTestId("header-notifications-bell"))
    .or(page.getByRole("heading", { name: /cupons|produtos|tickets|pedidos|painel|pdv|estoque|vendas|dashboard/i }))
    .or(page.getByRole("link", { name: /cadastre sua loja|crie uma loja|cadastrar loja/i }))
    .or(page.getByTestId("seller-global-search-trigger"))
    .first();

  await expect(ready).toBeAttached({ timeout });
  const box = await ready.boundingBox().catch(() => null);
  if (!box) {
    // Fallback: page URL is seller panel and body has substantive text
    await expect(page.locator("body")).toContainText(
      /painel|produtos|pedidos|estoque|cupons|dashboard|loja/i,
      { timeout: 5_000 },
    );
  } else {
    await expect(ready).toBeVisible({ timeout: 5_000 }).catch(async () => {
      await expect(page.locator("body")).toContainText(
        /painel|produtos|pedidos|estoque|cupons|dashboard|loja/i,
        { timeout: 5_000 },
      );
    });
  }
}

/** Aguarda /completar-perfil sair do loading (form autenticado ou gate de login). */
export async function waitForCompletarPerfilReady(page: Page, timeout = 25_000) {
  await expect(
    page
      .getByTestId("completar-perfil-login-required")
      .or(page.getByText(/faça login para continuar/i))
      .or(page.getByRole("heading", { name: /completar perfil/i }))
      .or(page.locator("#cpf"))
      .first(),
  ).toBeVisible({ timeout });
}
