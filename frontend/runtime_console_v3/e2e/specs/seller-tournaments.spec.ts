import { test as authTest, expect as authExpect } from "../fixtures/auth";
import { waitForSellerPanelReady } from "../helpers/wait-panel";

authTest.describe("Vendedor — torneios", () => {
  authTest.describe.configure({ timeout: 90_000 });

  authTest("seller acessa torneios e vê heading", async ({ sellerPage: page }) => {
    await page.goto("/vendedor/painel/torneios");
    await authExpect(page).toHaveURL(/\/vendedor\/painel\/torneios/, { timeout: 20_000 });
    await waitForSellerPanelReady(page);

    await authExpect(
      page
        .getByRole("heading", { name: /^torneios$/i })
        .or(page.getByRole("link", { name: /ver planos/i }))
        .or(page.getByRole("link", { name: /cadastre sua loja/i }))
        .first(),
    ).toBeVisible({ timeout: 30_000 });
  });

  authTest("fluxo criar torneio abre modal", async ({ sellerPage: page }) => {
    await page.goto("/vendedor/painel/torneios");
    await waitForSellerPanelReady(page);

    const upgrade = page.getByRole("link", { name: /ver planos/i });
    if ((await upgrade.count()) > 0) return;

    const newBtn = page.getByTestId("tournament-new-btn");
    if ((await newBtn.count()) === 0) return;
    await newBtn.click();

    await authExpect(page.getByTestId("tournament-create-modal")).toBeVisible({ timeout: 10_000 });
    await page.getByTestId("tournament-name-input").fill(`E2E ${Date.now()}`);
    await page.getByTestId("tournament-submit-btn").click();

    await authExpect(
      page
        .getByTestId("tournament-cards")
        .or(page.getByTestId("tournaments-empty"))
        .or(page.getByTestId("tournament-desktop-view"))
        .first(),
    ).toBeVisible({ timeout: 30_000 });
  });
});
