import { test as authTest, expect as authExpect } from "../fixtures/auth";

const MOCK_PROFILE_BEFORE = {
  total_xp: 100,
  current_level: 2,
  xp_for_current_level: 100,
  xp_for_next_level: 250,
  xp_to_next: 150,
  progress_percent: 0,
  badges_unlocked: 1,
  unlocked_badges: [],
  recent_events: [],
  stats: {
    purchases: 0,
    sales: 0,
    tournaments: 0,
    price_alerts: 0,
    reviews: 0,
    rulings: 0,
    community_answers: 0,
  },
};

authTest.describe("Gamificação integrada (checkout XP)", () => {
  authTest("fluxo: checkout success concede XP e atualiza perfil", async ({ buyerPage }) => {
    let profile = { ...MOCK_PROFILE_BEFORE };

    await buyerPage.route("**/api/gamification/profile", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(profile),
      });
    });

    await buyerPage.route("**/api/gamification/xp", async (route) => {
      if (route.request().method() === "POST") {
        profile = {
          ...profile,
          total_xp: 110,
          xp_to_next: 140,
          progress_percent: 7,
          recent_events: [
            {
              id: "xp-checkout",
              action: "marketplace_purchase",
              xp_amount: 10,
              created_at: new Date().toISOString(),
            },
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
    });

    await buyerPage.goto("/marketplace/checkout/success?order_id=e2e-order-1&total_cents=5000");
    await authExpect(buyerPage.getByText("Pagamento recebido!")).toBeVisible();

    await buyerPage.goto("/profile/gamification");
    const profileResponse = buyerPage.waitForResponse(
      (r) => r.url().includes("/api/gamification/profile") && r.status() === 200,
    );
    await profileResponse;
    await authExpect(buyerPage.getByTestId("gamification-profile")).toBeVisible({ timeout: 15000 });
    await authExpect(buyerPage.getByText("110")).toBeVisible();
  });
});
