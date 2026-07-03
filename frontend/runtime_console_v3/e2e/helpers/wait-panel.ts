import { expect, type Page } from "@playwright/test";



/** Aguarda o layout do painel exibir conteúdo após guards de auth/KYC. */
export async function waitForSellerPanelReady(page: Page, timeout = 60_000) {
  await expect(
    page
      .locator("main")
      .first()
      .or(page.getByTestId("seller-global-search-trigger"))
      .or(page.getByTestId("header-notifications-bell"))
      .or(page.getByTestId("dashboard-metrics"))
      .or(page.getByRole("heading", { name: /cupons|produtos|tickets|pedidos|painel|pdv|estoque|vendas|dashboard/i }))
      .or(page.getByText(/carregando painel|atualizando status do cadastro|redirecionando/i))
      .or(page.getByRole("link", { name: /cadastre sua loja|crie uma loja|cadastrar loja/i }))
      .first(),
  ).toBeVisible({ timeout });
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

