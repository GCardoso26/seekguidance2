import { test as authTest, expect as authExpect } from "../fixtures/auth";
import { test, expect } from "@playwright/test";

const MOCK_PROFILE = {
  total_xp: 900,
  current_level: 2,
  xp_for_current_level: 800,
  xp_for_next_level: 1200,
  xp_to_next: 300,
  progress_percent: 25,
  badges_unlocked: 1,
  unlocked_badges: [{ badge_id: "first_purchase", unlocked_at: "2026-06-01T00:00:00.000Z" }],
  recent_events: [
    {
      id: "xp-1",
      action: "marketplace_purchase",
      xp_amount: 10,
      created_at: new Date().toISOString(),
    },
  ],
  stats: {
    purchases: 1,
    sales: 0,
    tournaments: 0,
    price_alerts: 0,
    reviews: 0,
    rulings: 0,
    community_answers: 0,
  },
};

const MOCK_BADGES = {
  badges: [
    {
      id: "first_purchase",
      name: "Primeira compra",
      description: "Realizou a primeira compra no marketplace.",
      icon: "ShoppingBag",
      category: "buyer",
      rarity: "common",
      unlock_hint: "Faça sua primeira compra",
      unlocked: true,
      unlocked_at: "2026-06-01T00:00:00.000Z",
    },
    {
      id: "loyal_buyer",
      name: "Comprador fiel",
      description: "10 compras concluídas.",
      icon: "Heart",
      category: "buyer",
      rarity: "rare",
      unlock_hint: "Complete 10 compras",
      unlocked: false,
      unlocked_at: null,
    },
  ],
};

const MOCK_LEADERBOARD = {
  entries: Array.from({ length: 10 }, (_, i) => ({
    rank: i + 1,
    user_id: `u${i + 1}`,
    display_name: `Player ${i + 1}`,
    avatar_url: null,
    total_xp: 10000 - i * 500,
    current_level: 30 - i,
    badges_count: 5,
    city: "São Paulo",
  })),
  my_rank: null,
};

function mockGamificationApis(page: import("@playwright/test").Page) {
  let profile = { ...MOCK_PROFILE };

  return Promise.all([
    page.route("**/api/gamification/profile", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(profile),
      });
    }),
    page.route("**/api/gamification/badges", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_BADGES),
      });
    }),
    page.route("**/api/gamification/leaderboard**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_LEADERBOARD),
      });
    }),
    page.route("**/api/gamification/xp", async (route) => {
      if (route.request().method() === "POST") {
        profile = {
          ...profile,
          total_xp: profile.total_xp + 10,
          recent_events: [
            {
              id: "xp-new",
              action: "marketplace_purchase",
              xp_amount: 10,
              created_at: new Date().toISOString(),
            },
            ...profile.recent_events,
          ],
        };
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            profile,
            event: { action: "marketplace_purchase", xp_amount: 10 },
            new_badges: [],
          }),
        });
        return;
      }
      await route.continue();
    }),
  ]);
}

authTest.describe("Gamificação (autenticado)", () => {
  authTest.beforeEach(async ({ buyerPage }) => {
    await mockGamificationApis(buyerPage);
  });

  authTest("fluxo 1: perfil gamificação mostra nível e XP", async ({ buyerPage }) => {
    await mockGamificationApis(buyerPage);
    const profileResponse = buyerPage.waitForResponse(
      (r) => r.url().includes("/api/gamification/profile") && r.status() === 200,
    );
    await buyerPage.goto("/profile/gamification");
    await profileResponse;
    await authExpect(buyerPage.getByTestId("profile-gamification-route")).toBeVisible();
    await authExpect(buyerPage.getByTestId("gamification-profile")).toBeVisible({ timeout: 15000 });
    await authExpect(buyerPage.getByText("Nível 2")).toBeVisible();
    await authExpect(buyerPage.getByText("900")).toBeVisible();
  });

  authTest("fluxo 2: badges mostra badge desbloqueado", async ({ buyerPage }) => {
    await mockGamificationApis(buyerPage);
    const badgesResponse = buyerPage.waitForResponse(
      (r) => r.url().includes("/api/gamification/badges") && r.status() === 200,
    );
    await buyerPage.goto("/badges");
    await badgesResponse;
    await authExpect(buyerPage.getByTestId("badges-route")).toBeVisible();
    await authExpect(buyerPage.getByTestId("badge-card-first_purchase")).toBeVisible();
    await buyerPage.getByTestId("badge-card-first_purchase").click();
    await authExpect(buyerPage.getByTestId("badge-detail")).toContainText("Primeira compra");
    await authExpect(buyerPage.getByTestId("badge-detail")).toContainText("Desbloqueado");
  });

  authTest("fluxo 3: leaderboard top 10 visível", async ({ buyerPage }) => {
    await mockGamificationApis(buyerPage);
    const leaderboardResponse = buyerPage.waitForResponse(
      (r) => r.url().includes("/api/gamification/leaderboard") && r.status() === 200,
    );
    await buyerPage.goto("/leaderboard");
    await leaderboardResponse;
    await authExpect(buyerPage.getByTestId("leaderboard-xp-tab")).toBeVisible();
    await authExpect(buyerPage.getByTestId("leaderboard-row-1")).toBeVisible({ timeout: 15000 });
    await authExpect(buyerPage.getByTestId("leaderboard-row-10")).toBeVisible({ timeout: 15000 });
  });
});

test.describe("Gamificação (público)", () => {
  test("leaderboard carrega sem auth", async ({ page }) => {
    await mockGamificationApis(page);
    await page.goto("/leaderboard");
    await expect(page.getByTestId("leaderboard-xp-tab")).toBeVisible({ timeout: 15000 });
  });
});
