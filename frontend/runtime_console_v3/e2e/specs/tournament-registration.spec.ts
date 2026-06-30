import { test as authTest, expect as authExpect } from "../fixtures/auth";
import { test, expect } from "@playwright/test";
import { waitForSellerPanelReady } from "../helpers/wait-panel";

const MOCK_TOURNAMENT_ID = "e2e-tournament-reg-001";

const mockTournament = {
  id: MOCK_TOURNAMENT_ID,
  name: "E2E Torneio Gratuito",
  game_code: "MTG",
  format_code: "STANDARD",
  status: "registration_open",
  entry_fee_cents: 0,
  max_players: 32,
  starts_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  city: "São Paulo",
  registered: 1,
};

function mockTournamentApis(page: import("@playwright/test").Page, opts?: { entryFeeCents?: number }) {
  const fee = opts?.entryFeeCents ?? 0;
  const tournament = { ...mockTournament, entry_fee_cents: fee };

  return Promise.all([
    page.route(`**/api/tournament/tournaments/${MOCK_TOURNAMENT_ID}`, async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(tournament) });
        return;
      }
      await route.continue();
    }),
    page.route(`**/api/tournament/tournaments/${MOCK_TOURNAMENT_ID}/participants*`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          registered_count: 1,
          max_players: 32,
          players: [{ label: "Jogador #1", status: "registered" }],
        }),
      });
    }),
    page.route(`**/api/tournament/tournaments/${MOCK_TOURNAMENT_ID}/registration/status`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: "not_registered", can_cancel: false }),
      });
    }),
    page.route(`**/api/tournament/tournaments/${MOCK_TOURNAMENT_ID}/register`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ participantId: "p1", status: "registered" }),
      });
    }),
    page.route(`**/api/account/status`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          player: { account_status: "active", cpf_verified: true, can_purchase: true },
        }),
      });
    }),
  ]);
}

authTest.describe("Inscrição em torneio", () => {
  authTest.describe.configure({ timeout: 90_000 });

  authTest("fluxo gratuito: página pública → inscrever → confirmado", async ({ buyerPage: page }) => {
    let registered = false;

    await mockTournamentApis(page);

    await page.route(`**/api/tournament/tournaments/${MOCK_TOURNAMENT_ID}/registration/status`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          registered
            ? { status: "confirmed", can_cancel: true, participant_id: "p1" }
            : { status: "not_registered", can_cancel: false },
        ),
      });
    });

    await page.route(`**/api/tournament/tournaments/${MOCK_TOURNAMENT_ID}/register`, async (route) => {
      registered = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ participantId: "p1", status: "registered" }),
      });
    });

    await page.goto(`/tournament/${MOCK_TOURNAMENT_ID}`);
    await authExpect(page.getByTestId("tournament-public-section")).toBeVisible({ timeout: 20_000 });
    await authExpect(page.getByTestId("tournament-register-btn")).toBeVisible();

    await page.getByTestId("tournament-register-btn").click();
    await authExpect(page.getByTestId("tournament-register-confirm-modal")).toBeVisible();
    await page.getByTestId("tournament-register-confirm-btn").click();

    await authExpect(page.getByTestId("registration-user-status")).toContainText(/inscrito/i, {
      timeout: 15_000,
    });
  });

  authTest("fluxo pago: redireciona para checkout", async ({ buyerPage: page }) => {
    await mockTournamentApis(page, { entryFeeCents: 2500 });

    await page.route(`**/api/payments/intent`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          clientSecret: "pi_test_secret",
          paymentIntentId: "pi_test",
          amountCents: 2625,
        }),
      });
    });

    await page.goto(`/tournament/${MOCK_TOURNAMENT_ID}`);
    await authExpect(page.getByTestId("tournament-public-section")).toBeVisible({ timeout: 20_000 });
    await authExpect(page.getByTestId("tournament-registration-panel").getByText(/R\$\s*25,00/)).toBeVisible({
      timeout: 15_000,
    });
    const checkoutLink = page.locator(
      `a[data-testid="tournament-register-btn"][href="/tournament/${MOCK_TOURNAMENT_ID}/checkout"]`,
    );
    await authExpect(checkoutLink).toBeVisible({ timeout: 15_000 });
    await checkoutLink.click();
    await page.waitForURL(new RegExp(`/tournament/${MOCK_TOURNAMENT_ID}/checkout`), {
      timeout: 20_000,
      waitUntil: "domcontentloaded",
    });
    await authExpect(page.getByTestId("tournament-checkout-title")).toBeVisible({ timeout: 15_000 });
    await authExpect(
      page
        .getByTestId("tournament-checkout-loading")
        .or(page.getByTestId("tournament-checkout-form"))
        .or(page.getByTestId("tournament-checkout-stripe-missing"))
        .first(),
    ).toBeVisible({ timeout: 15_000 });
  });
});

authTest.describe("Painel — inscritos torneio", () => {
  authTest("lojista acessa página de inscritos", async ({ sellerPage: page }) => {
    const tournamentId = "seller-tournament-1";

    await page.route(`**/api/tournament/tournaments/${tournamentId}/participants?admin=1`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          total: 1,
          participants: [
            {
              id: "part-1",
              user_id: "user-1",
              display_name: "Jogador Teste",
              status: "registered",
              created_at: new Date().toISOString(),
              payment_status: "paid",
              payment_amount_cents: 2500,
            },
          ],
        }),
      });
    });

    await page.goto(`/vendedor/painel/torneios/${tournamentId}/inscritos`);
    await waitForSellerPanelReady(page);
    await authExpect(page.getByTestId("tournament-inscritos-page")).toBeVisible({ timeout: 20_000 });
    await authExpect(page.getByTestId("inscritos-table")).toBeVisible();
    await authExpect(page.getByText("Jogador Teste")).toBeVisible();
  });
});

test.describe("Torneio público (anônimo)", () => {
  test("página pública carrega seção de inscrição", async ({ page }) => {
    await mockTournamentApis(page);
    await page.goto(`/tournament/${MOCK_TOURNAMENT_ID}`);
    await expect(page.getByTestId("tournament-public-section")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("tournament-participants-list")).toBeVisible();
  });
});
