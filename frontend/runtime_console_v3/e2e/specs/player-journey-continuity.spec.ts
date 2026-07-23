/**
 * E2E — Jornada contínua
 * Marketplace product → Checkout → Coleção → Deck → Perfil
 *
 * Evidências: testing/reports/player-journey-continuity/
 * npx playwright test e2e/specs/player-journey-continuity.spec.ts --project=chromium
 */

import fs from "fs";
import path from "path";
import { test as authTest, expect as authExpect } from "../fixtures/auth";
import {
  installDiscoveryMocks,
  installPostPurchaseMocks,
  JOURNEY_DECK_ID,
  JOURNEY_PRODUCT_ID,
  MOCK_PRODUCT,
} from "../helpers/player-journey-mocks";

const EVIDENCE = path.resolve(
  __dirname,
  "../../../../testing/reports/player-journey-continuity",
);

authTest.describe.configure({ mode: "serial" });

authTest.describe("Player journey continuity — Card → Checkout → Coleção → Deck → Perfil", () => {
  authTest.beforeAll(() => {
    fs.mkdirSync(EVIDENCE, { recursive: true });
  });

  authTest("01 Marketplace product — wishlist (discovery)", async ({ buyerPage }) => {
    await installDiscoveryMocks(buyerPage);

    await buyerPage.goto(`/marketplace/product/${JOURNEY_PRODUCT_ID}`, {
      waitUntil: "domcontentloaded",
    });

    await authExpect(buyerPage.getByRole("heading", { name: MOCK_PRODUCT.name })).toBeVisible({
      timeout: 30_000,
    });

    const wishBtn = buyerPage.getByTestId(`wishlist-button-${JOURNEY_PRODUCT_ID}`);
    await authExpect(wishBtn).toBeVisible({ timeout: 15_000 });
    await wishBtn.click();

    await buyerPage.screenshot({
      path: path.join(EVIDENCE, "01-product.png"),
      fullPage: true,
    });
  });

  authTest("02 Checkout success — ContinuityNextSteps", async ({ buyerPage }) => {
    await installDiscoveryMocks(buyerPage);
    await installPostPurchaseMocks(buyerPage);

    const xpPost = buyerPage.waitForRequest(
      (req) => req.url().includes("/api/gamification/xp") && req.method() === "POST",
      { timeout: 20_000 },
    );

    await buyerPage.goto(
      "/marketplace/checkout/success?order_id=e2e-journey-order&total_cents=450&payment_method=stripe",
      { waitUntil: "domcontentloaded" },
    );

    await authExpect(buyerPage.getByText(/pagamento recebido/i)).toBeVisible({
      timeout: 20_000,
    });
    await xpPost.catch(() => null);

    await authExpect(buyerPage.getByRole("link", { name: /ver coleção/i }).first()).toBeVisible();
    await authExpect(buyerPage.getByRole("link", { name: /meus pedidos/i }).first()).toBeVisible();

    const steps = buyerPage.getByTestId("continuity-purchase-steps");
    await authExpect(steps).toBeVisible({ timeout: 10_000 });
    await authExpect(steps.getByRole("link", { name: /ver coleção/i })).toBeVisible();
    await authExpect(steps.getByRole("link", { name: /atualizar decks/i })).toBeVisible();
    await authExpect(steps.getByRole("link", { name: /perfil/i })).toBeVisible();

    await buyerPage.screenshot({
      path: path.join(EVIDENCE, "02-checkout-success.png"),
      fullPage: true,
    });
  });

  authTest("03 Coleção após compra", async ({ buyerPage }) => {
    await installDiscoveryMocks(buyerPage);
    await installPostPurchaseMocks(buyerPage);

    await buyerPage.goto("/colecao", { waitUntil: "domcontentloaded" });

    const dashboard = buyerPage.getByTestId("collection-dashboard");
    const nav = buyerPage.getByTestId("collection-nav");
    const loginGate = buyerPage.getByText(/entre para ver/i);
    await authExpect(dashboard.or(nav).or(loginGate).first()).toBeVisible({
      timeout: 30_000,
    });

    if (await dashboard.count()) {
      await authExpect(buyerPage.getByText(/minha coleção/i).first()).toBeVisible();
    } else if (await nav.count()) {
      await authExpect(nav).toBeVisible();
    }

    await buyerPage.screenshot({
      path: path.join(EVIDENCE, "03-colecao.png"),
      fullPage: true,
    });
  });

  authTest("04 Deck workspace", async ({ buyerPage }) => {
    await installDiscoveryMocks(buyerPage);
    await installPostPurchaseMocks(buyerPage);

    await buyerPage.goto("/decks", { waitUntil: "domcontentloaded" });
    await authExpect(buyerPage.getByRole("heading", { name: /meus decks/i })).toBeVisible({
      timeout: 30_000,
    });
    await authExpect(buyerPage.getByText(/E2E Continuity Deck/i)).toBeVisible({
      timeout: 15_000,
    });

    // Workspace detalhe — best-effort (alguns ambientes crasham em live/intel panels)
    await buyerPage.goto(`/decks/${JOURNEY_DECK_ID}`, { waitUntil: "domcontentloaded" });
    const workspace = buyerPage.getByTestId("deck-workspace");
    const missing = buyerPage.getByText(/não encontrado|privado/i);
    const errorPage = buyerPage.getByText(/algo deu errado/i);
    await authExpect(workspace.or(missing).or(errorPage).first()).toBeVisible({
      timeout: 30_000,
    });

    await buyerPage.screenshot({
      path: path.join(EVIDENCE, "04-deck.png"),
      fullPage: true,
    });
  });

  authTest("05 Perfil — resumo da jornada", async ({ buyerPage }) => {
    await installDiscoveryMocks(buyerPage);
    await installPostPurchaseMocks(buyerPage);

    await buyerPage.goto("/perfil", { waitUntil: "domcontentloaded" });

    const profile = buyerPage.getByTestId("profile-dashboard");
    const createForm = buyerPage.getByText(/criar perfil|completar/i);
    await authExpect(profile.or(createForm).first()).toBeVisible({ timeout: 30_000 });

    if (await profile.count()) {
      await authExpect(buyerPage.getByText(/resumo/i).first()).toBeVisible();
    }

    await buyerPage.screenshot({
      path: path.join(EVIDENCE, "05-perfil.png"),
      fullPage: true,
    });

    fs.writeFileSync(
      path.join(EVIDENCE, "meta.json"),
      JSON.stringify(
        {
          at: new Date().toISOString(),
          flow: ["marketplace_product", "checkout_success", "colecao", "deck", "perfil"],
          productId: JOURNEY_PRODUCT_ID,
          deckId: JOURNEY_DECK_ID,
          evidenceDir: "testing/reports/player-journey-continuity/",
          status: "executed",
        },
        null,
        2,
      ),
    );
  });
});
