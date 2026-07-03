import { test as authTest, expect } from "../fixtures/auth";
import { waitForSellerPanelReady } from "../helpers/wait-panel";

authTest.describe("Seller catalog sprint 2", () => {
  authTest.describe.configure({ timeout: 90_000 });

  authTest("catalog cards page shows games and search", async ({ sellerPage: page }) => {
    await page.goto("/vendedor/painel/catalogo/cartas");
    await waitForSellerPanelReady(page);
    await expect(page.getByRole("button", { name: "Magic" })).toBeVisible({ timeout: 20_000 });
    await page.getByPlaceholder("Pesquisar carta…").fill("Lightning");
    await expect(page.getByText("Lightning Bolt")).toBeVisible({ timeout: 15_000 });
  });
});

authTest.describe("Seller products", () => {
  authTest.describe.configure({ timeout: 90_000 });

  authTest("products page shows categories", async ({ sellerPage: page }) => {
    await page.goto("/vendedor/painel/catalogo/produtos");
    await waitForSellerPanelReady(page);
    await expect(page.getByRole("button", { name: "Sleeves" })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("button", { name: "Deck Box" })).toBeVisible();
  });
});

authTest.describe("Seller customers", () => {
  authTest.describe.configure({ timeout: 90_000 });

  authTest("customer drawer shows gamification tab", async ({ sellerPage: page }) => {
    await page.goto("/vendedor/painel/clientes/lista");
    await waitForSellerPanelReady(page);
    await page.getByText("João").click();
    await expect(page.getByText("Gamificação")).toBeVisible();
    await page.getByText("Gamificação").click();
    await expect(page.getByText("Nível")).toBeVisible();
  });
});

authTest.describe("Seller tickets", () => {
  authTest.describe.configure({ timeout: 90_000 });

  authTest("tickets page shows tabs and creates ticket", async ({ sellerPage: page }) => {
    await page.goto("/vendedor/painel/atendimento/tickets");
    await waitForSellerPanelReady(page);
    await expect(page.getByText("Abertos")).toBeVisible({ timeout: 20_000 });
    await page.getByText("+ Novo Ticket").click();
    await page.getByLabel("Assunto").fill("Pedido não recebido");
    await page.getByText("Criar").click();
    await expect(page.getByText("Ticket criado", { exact: true })).toBeVisible({ timeout: 15_000 });
  });
});
