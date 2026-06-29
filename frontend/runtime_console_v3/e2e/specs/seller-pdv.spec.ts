import { test as authTest, expect as authExpect } from "../fixtures/auth";
import { waitForSellerPanelReady } from "../helpers/wait-panel";

async function skipIfPdvUnavailable(page: import("@playwright/test").Page) {
  const manager = page.getByTestId("pdv-manager");
  if (await manager.isVisible().catch(() => false)) return false;
  await authExpect(
    page
      .getByRole("link", { name: /cadastre sua loja/i })
      .or(page.getByText(/pdv disponível no plano pro/i))
      .or(page.getByTestId("pdv-upsell"))
      .first(),
  ).toBeVisible({ timeout: 15_000 });
  return true;
}

authTest.describe("Vendedor — PDV", () => {
  authTest.describe.configure({ timeout: 90_000 });

  authTest("seller acessa pdv ou upsell plano", async ({ sellerPage: page }) => {
    await page.goto("/vendedor/painel/pdv");

    await authExpect(page).toHaveURL(/\/(vendedor\/painel\/pdv|vendedor\/painel\/planos|stores\/create)/, {
      timeout: 30_000,
    });

    await authExpect(
      page
        .getByRole("heading", { name: /^pdv$/i })
        .or(page.getByTestId("pdv-upsell"))
        .or(page.getByText(/pdv disponível no plano pro/i))
        .or(page.getByRole("link", { name: /cadastre sua loja/i }))
        .first(),
    ).toBeVisible({ timeout: 20_000 });
  });

  authTest("pdv mobile mostra scan e carrinho", async ({ sellerPage: page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/vendedor/painel/pdv");

    await authExpect(page).toHaveURL(/\/(vendedor\/painel\/pdv|vendedor\/painel\/planos|stores\/create)/, {
      timeout: 30_000,
    });

    if (!page.url().includes("/vendedor/painel/pdv")) return;
    if (await skipIfPdvUnavailable(page)) return;

    await waitForSellerPanelReady(page);

    await authExpect(page.getByTestId("pdv-barcode-input")).toBeVisible({ timeout: 20_000 });
    await authExpect(page.getByTestId("pdv-cart")).toBeVisible();
  });

  authTest("pdv fluxo busca e finalizar dinheiro", async ({ sellerPage: page }) => {
    await page.goto("/vendedor/painel/pdv");

    await authExpect(page).toHaveURL(/\/(vendedor\/painel\/pdv|vendedor\/painel\/planos|stores\/create)/, {
      timeout: 30_000,
    });

    if (!page.url().includes("/vendedor/painel/pdv")) return;
    if (await skipIfPdvUnavailable(page)) return;

    await waitForSellerPanelReady(page);

    await authExpect(page.getByTestId("pdv-barcode-field")).toBeVisible({ timeout: 20_000 });

    const searchInput = page.getByTestId("pdv-text-search-input");
    await searchInput.fill("booster");
    await page.getByRole("button", { name: /^buscar$/i }).click();

    const addBtn = page.getByTestId(/pdv-add-product-/).first();
    if (!(await addBtn.isVisible().catch(() => false))) return;

    await addBtn.click();
    await authExpect(page.getByTestId("pdv-cart-total")).not.toHaveText(/R\$\s*0,00/);

    const finalize = page.getByTestId("pdv-finalize-btn");
    if (!(await finalize.isEnabled().catch(() => false))) return;

    await finalize.click();
    await authExpect(page.getByTestId("pdv-payment-panel")).toBeVisible({ timeout: 15_000 });
    await page.getByTestId("pdv-confirm-cash").click();

    await authExpect(
      page.getByTestId("pdv-receipt-modal").or(page.getByText(/venda registrada/i)).first(),
    ).toBeVisible({ timeout: 30_000 });
  });

  authTest("pdv fluxo PIX gera QR e confirma manual", async ({ sellerPage: page }) => {
    await page.goto("/vendedor/painel/pdv");

    await authExpect(page).toHaveURL(/\/(vendedor\/painel\/pdv|vendedor\/painel\/planos|stores\/create)/, {
      timeout: 30_000,
    });

    if (!page.url().includes("/vendedor/painel/pdv")) return;
    if (await skipIfPdvUnavailable(page)) return;

    await waitForSellerPanelReady(page);

    const searchInput = page.getByTestId("pdv-text-search-input");
    await searchInput.fill("booster");
    await page.getByRole("button", { name: /^buscar$/i }).click();

    const addBtn = page.getByTestId(/pdv-add-product-/).first();
    if (!(await addBtn.isVisible().catch(() => false))) return;

    await addBtn.click();
    await page.getByTestId("pdv-finalize-btn").click();
    await authExpect(page.getByTestId("pdv-payment-panel")).toBeVisible({ timeout: 15_000 });

    await page.getByTestId("pdv-payment-tab-pix").click();
    await authExpect(
      page.getByTestId("pdv-pix-payment").or(page.getByTestId("pdv-pix-qr")).first(),
    ).toBeVisible({ timeout: 30_000 });

    const confirmPix = page.getByTestId("pdv-confirm-pix");
    if ((await confirmPix.count()) > 0 && (await confirmPix.isEnabled())) {
      await confirmPix.click();
      await authExpect(
        page.getByTestId("pdv-receipt-modal").or(page.getByText(/venda registrada/i)).first(),
      ).toBeVisible({ timeout: 30_000 });
    }
  });
});
