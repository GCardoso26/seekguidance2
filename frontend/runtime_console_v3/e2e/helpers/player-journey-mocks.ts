/**
 * API mocks for the continuous player journey E2E.
 * Split: discovery (product/wishlist) vs post-purchase (collection/deck/profile).
 */

import type { Page } from "@playwright/test";

export const JOURNEY_CARD_ID = "e2e-journey-card";
export const JOURNEY_DECK_ID = "e2e-journey-deck";
export const JOURNEY_PRODUCT_ID = "e2e-journey-product";

export const MOCK_PRODUCT = {
  id: JOURNEY_PRODUCT_ID,
  name: "E2E Journey Lightning Bolt",
  category: "single",
  tcg_id: "mtg",
  price_cents: 450,
  stock: 10,
  store_name: "E2E Store",
  store_slug: "e2e-store",
  images: ["/logos/mtg.svg"],
  condition: "NM",
};

/** Minimal mocks — same surface as wishlist.spec (safe for product page). */
export async function installDiscoveryMocks(page: Page): Promise<void> {
  let wishlistItems: Array<{
    product_id: string;
    added_at: string;
    product: typeof MOCK_PRODUCT;
  }> = [];

  await page.route("**/api/wishlist", async (route) => {
    const method = route.request().method();
    if (method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: wishlistItems, total: wishlistItems.length }),
      });
      return;
    }
    if (method === "POST") {
      const body = route.request().postDataJSON() as { product_id?: string };
      const productId = body.product_id ?? MOCK_PRODUCT.id;
      if (!wishlistItems.some((i) => i.product_id === productId)) {
        wishlistItems = [
          {
            product_id: productId,
            added_at: new Date().toISOString(),
            product: { ...MOCK_PRODUCT, id: productId },
          },
          ...wishlistItems,
        ];
      }
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(wishlistItems[0]),
      });
      return;
    }
    await route.continue();
  });

  await page.route(`**/api/wishlist/${JOURNEY_PRODUCT_ID}`, async (route) => {
    if (route.request().method() === "DELETE") {
      wishlistItems = wishlistItems.filter((i) => i.product_id !== JOURNEY_PRODUCT_ID);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
      return;
    }
    await route.continue();
  });

  await page.route("**/api/account/status", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        player: { account_status: "active", cpf_verified: true, can_purchase: true },
      }),
    });
  });

  await page.route(`**/api/marketplace/shop/products/${JOURNEY_PRODUCT_ID}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ product: MOCK_PRODUCT }),
    });
  });

  await page.route("**/api/marketplace/shop/products*", async (route) => {
    if (route.request().method() !== "GET") {
      await route.continue();
      return;
    }
    if (route.request().url().includes(`/products/${JOURNEY_PRODUCT_ID}`)) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ product: MOCK_PRODUCT }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ products: [MOCK_PRODUCT], total: 1 }),
    });
  });

  await page.route("**/api/marketplace/shop/cart", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ cart: { id: "c1", items: [], total_cents: 0 } }),
    });
  });
}

/** Post-purchase cascade — collection, decks, gamification, profile. */
export async function installPostPurchaseMocks(page: Page): Promise<void> {
  await page.route("**/api/user/collection/insights**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        totalValue: 218,
        currency: "BRL",
        valueChange7d: 5,
        valueChange30d: 18,
        valueChange7dPct: 2,
        valueChange30dPct: 9,
        series7d: [],
        series30d: [],
        series90d: [],
        series1y: [],
        totalCards: 42,
        uniqueCards: 40,
        duplicates: 2,
        foilCount: 1,
        premiumCount: 0,
        sealedCount: 0,
        accessoryCount: 0,
        avgLiquidity: "medium",
        updatedAt: new Date().toISOString(),
        byGame: [],
        bySet: [],
        recentAcquisitions: [],
        items: [],
        insufficientHistory: false,
      }),
    });
  });

  await page.route("**/api/user/collection/missing**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        game: "mtg",
        set: "M21",
        missingCount: 0,
        minPrice: null,
        avgPrice: null,
        sumPrice: null,
        currency: "BRL",
        missing: [],
      }),
    });
  });

  await page.route("**/api/user/collection", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [
            {
              id: "col-1",
              card_id: JOURNEY_CARD_ID,
              quantity: 1,
              condition: "NM",
              is_foil: false,
            },
          ],
        }),
      });
      return;
    }
    await route.continue();
  });

  await page.route("**/api/user/collection?**", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [
            {
              id: "col-1",
              card_id: JOURNEY_CARD_ID,
              quantity: 1,
              condition: "NM",
              is_foil: false,
            },
          ],
        }),
      });
      return;
    }
    await route.continue();
  });

  await page.route("**/api/decks**", async (route) => {
    const url = route.request().url();
    const method = route.request().method();
    if (method === "GET" && /\/api\/decks\/?(\?|$)/.test(url)) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          decks: [
            {
              id: JOURNEY_DECK_ID,
              name: "E2E Continuity Deck",
              game: "mtg",
              format: "standard",
              is_public: false,
              main_deck: [{ id: "e1", card_id: JOURNEY_CARD_ID, quantity: 4 }],
              sideboard: [],
            },
          ],
        }),
      });
      return;
    }
    if (method === "GET" && url.includes(`/api/decks/${JOURNEY_DECK_ID}`)) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          deck: {
            id: JOURNEY_DECK_ID,
            name: "E2E Continuity Deck",
            game: "mtg",
            format: "standard",
            is_public: false,
            description: "Deck da jornada contínua",
            main_deck: [{ id: "e1", card_id: JOURNEY_CARD_ID, quantity: 4 }],
            sideboard: [],
          },
        }),
      });
      return;
    }
    await route.continue();
  });

  await page.route("**/api/buyer/decks/*/shop**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        owned_pct: 92,
        missing_count: 3,
        min_cost: 82,
        avg_cost: 110,
        savings: 28,
      }),
    });
  });

  await page.route("**/api/buyer/dashboard**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        collection: { unique_cards: 40, total_cards: 42 },
        orders: { total: 1 },
        wishlist: { total: 1 },
      }),
    });
  });

  await page.route("**/api/gamification/xp", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        profile: { progress_percent: 12 },
        event: { action: "marketplace_purchase", xp_amount: 10 },
        new_badges: [],
      }),
    });
  });

  await page.route("**/api/gamification/profile**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        total_xp: 110,
        current_level: 2,
        xp_for_current_level: 100,
        xp_for_next_level: 250,
        xp_to_next: 140,
        progress_percent: 12,
        badges_unlocked: 1,
        unlocked_badges: [],
        recent_events: [],
        stats: {
          purchases: 1,
          sales: 0,
          tournaments: 0,
          price_alerts: 0,
          reviews: 0,
          rulings: 0,
          community_answers: 0,
        },
      }),
    });
  });

  await page.route("**/api/players/me**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "player-e2e",
        display_name: "Carlos E2E",
        username: "carlos-e2e",
        bio: "Jornada contínua",
      }),
    });
  });
}

/** @deprecated use installDiscoveryMocks + installPostPurchaseMocks */
export async function installPlayerJourneyMocks(page: Page): Promise<void> {
  await installDiscoveryMocks(page);
  await installPostPurchaseMocks(page);
}
