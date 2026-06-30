import { test as authTest, expect as authExpect } from "../fixtures/auth";
import { test, expect } from "@playwright/test";
import { waitForSellerPanelReady } from "../helpers/wait-panel";

const MOCK_ID = "e2e-bracket-001";

const mockTournament = {
  id: MOCK_ID,
  name: "E2E Bracket Test",
  game_code: "MTG",
  format_code: "STANDARD",
  status: "draft",
  phase: "draft",
  pairing_format: "swiss",
  current_round: 0,
  total_swiss_rounds: 3,
  max_players: 8,
};

function mockBracketApis(page: import("@playwright/test").Page, opts?: { phase?: string }) {
  const tournament = { ...mockTournament, phase: opts?.phase ?? "draft", status: opts?.phase ?? "draft" };

  return Promise.all([
    page.route(`**/api/tournament/tournaments/${MOCK_ID}`, async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(tournament) });
        return;
      }
      await route.continue();
    }),
    page.route(`**/api/tournament/tournaments/${MOCK_ID}/bracket`, async (route) => {
      await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ detail: "not found" }) });
    }),
    page.route(`**/api/tournament/tournaments/${MOCK_ID}/standings`, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
    }),
  ]);
}

test.describe("Bracket público", () => {
  test("placeholder quando torneio não iniciado", async ({ page }) => {
    await mockBracketApis(page);
    await page.goto(`/tournament/${MOCK_ID}/bracket`);
    await expect(page.getByTestId("tournament-bracket-panel")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("bracket-placeholder")).toBeVisible();
    await expect(page.getByTestId("bracket-legend")).toBeVisible();
  });
});

authTest.describe("Bracket — lojista", () => {
  authTest.describe.configure({ timeout: 90_000 });

  authTest("painel bracket carrega", async ({ sellerPage: page }) => {
    await mockBracketApis(page, { phase: "in_progress" });

    await page.route(`**/api/tournament/tournaments/${MOCK_ID}`, async (route) => {
      if (route.request().method() !== "GET") {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ...mockTournament,
          phase: "in_progress",
          status: "in_progress",
          current_round: 1,
        }),
      });
    });

    await page.route(`**/api/tournament/tournaments/${MOCK_ID}/rounds/1`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          pairings: [
            {
              id: "p1",
              table_number: 1,
              player1_name: "Alice",
              player2_name: "Bob",
              status: "pending",
            },
          ],
        }),
      });
    });

    await page.route(`**/api/tournament/tournaments/${MOCK_ID}/standings`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            rank: 1,
            display_name: "Alice",
            match_points: 3,
            omw_percent: 50,
            gw_percent: 60,
            ogw_percent: 45,
            status: "active",
          },
        ]),
      });
    });

    await page.goto(`/vendedor/painel/torneios/${MOCK_ID}/bracket`);
    await waitForSellerPanelReady(page);
    await authExpect(page.getByTestId("seller-bracket-page")).toBeVisible({ timeout: 20_000 });
    await authExpect(
      page
        .getByTestId("swiss-bracket")
        .or(page.getByTestId("bracket-placeholder"))
        .or(page.getByTestId("swiss-bracket-empty")),
    ).toBeVisible({ timeout: 15_000 });
    await authExpect(page.getByTestId("bracket-standings")).toBeVisible({ timeout: 15_000 });
  });
});

authTest.describe("Bracket — fluxo ativo", () => {
  authTest("bracket eliminatório visível", async ({ sellerPage: page }) => {
    await page.route(`**/api/tournament/tournaments/${MOCK_ID}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ...mockTournament,
          phase: "bracket_active",
          status: "bracket_active",
          created_by: "seller-user",
        }),
      });
    });

    await page.route(`**/api/tournament/tournaments/${MOCK_ID}/bracket`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          bracketId: "b1",
          tournamentId: MOCK_ID,
          topCut: 4,
          status: "active",
          matches: [
            {
              id: "m1",
              roundNumber: 1,
              matchNumber: 1,
              player1Id: "u1",
              player2Id: "u2",
              player1Name: "Alice",
              player2Name: "Bob",
              winnerId: null,
              status: "pending",
            },
          ],
        }),
      });
    });

    await page.route(`**/api/tournament/tournaments/${MOCK_ID}/standings`, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
    });

    await page.goto(`/tournament/${MOCK_ID}/bracket`);
    await authExpect(page.getByTestId("elimination-bracket")).toBeVisible({ timeout: 20_000 });
    await authExpect(page.getByText("Alice")).toBeVisible();
  });
});
