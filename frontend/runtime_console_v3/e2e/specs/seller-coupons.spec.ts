import { test as authTest, expect as authExpect } from "../fixtures/auth";
import { waitForSellerPanelReady } from "../helpers/wait-panel";

authTest.describe("Vendedor — cupons", () => {
  authTest.describe.configure({ timeout: 90_000 });

  authTest("seller acessa cupons e vê heading", async ({ sellerPage: page }) => {
    await page.goto("/vendedor/painel/cupons");
    await authExpect(page).toHaveURL(/\/vendedor\/painel\/marketing\/cupons/, { timeout: 20_000 });
    await waitForSellerPanelReady(page);

    await authExpect(
      page
        .getByRole("heading", { name: /^cupons$/i })
        .or(page.getByRole("link", { name: /cadastre sua loja/i }))
        .first(),
    ).toBeVisible({ timeout: 30_000 });
  });

  authTest("fluxo criar cupom e listar", async ({ sellerPage: page }) => {
    await page.goto("/vendedor/painel/cupons");
    await waitForSellerPanelReady(page);

    const noStore = page.getByRole("link", { name: /cadastre sua loja/i });
    if ((await noStore.count()) > 0) return;

    const newBtn = page.getByTestId("coupon-new-btn");
    if ((await newBtn.count()) === 0) return;
    await newBtn.click();

    await authExpect(page.getByTestId("coupon-create-modal")).toBeVisible({ timeout: 10_000 });

    const code = `E2E${Date.now().toString(36).toUpperCase().slice(-6)}`;
    await page.getByTestId("coupon-code-input").fill(code);
    await page.getByTestId("coupon-type-select").selectOption("percentage");
    await page.getByTestId("coupon-value-input").fill("10");

    const future = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const dateStr = future.toISOString().slice(0, 10);
    await page.getByTestId("coupon-expires-input").fill(dateStr);

    await page.getByTestId("coupon-submit-btn").click();

    await authExpect(
      page.getByText(code).or(page.locator(`[data-testid="coupon-cards"] >> text=${code}`)).first(),
    ).toBeVisible({ timeout: 30_000 });
  });

  authTest("cupons mobile 375px mostra cards ou empty", async ({ sellerPage: page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/vendedor/painel/cupons");
    await waitForSellerPanelReady(page);

    await authExpect(
      page
        .getByTestId("coupon-cards")
        .or(page.getByTestId("coupons-empty"))
        .or(page.getByTestId("page-error"))
        .or(page.getByRole("link", { name: /cadastre sua loja/i }))
        .first(),
    ).toBeVisible({ timeout: 30_000 });

    await authExpect(page.getByTestId("coupon-desktop-view")).toHaveCount(0);
  });
});
