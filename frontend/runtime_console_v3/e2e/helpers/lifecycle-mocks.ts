import fs from "fs";
import path from "path";
import type { Page, Route } from "@playwright/test";
import {
  marceloPersonaDashboardOverviewMock,
} from "../../src/lib/seller-persona-marcelo-mock";

export type LifecycleSeed = {
  runId: string;
  store: {
    id: string;
    slug: string;
    name: string;
    subscription_plan: string;
    shop_enabled: boolean;
  };
  products: Array<{
    id: string;
    name: string;
    category: string;
    price_cents: number;
    stock: number;
    sku?: string | null;
    is_active?: boolean;
  }>;
  stock: Array<{
    id: string;
    product_id: string;
    title: string;
    quantity: number;
    price_cents: number;
    kind: string;
    category?: string;
  }>;
  orders: Array<{
    id: string;
    status: string;
    total_cents: number;
    payment_method?: string;
    customer_name?: string;
    created_at: string;
    fulfillment_status?: string;
  }>;
  report: {
    revenue_cents: number;
    sales_count: number;
    unique_buyers: number;
    average_order_value: number;
    chart: Array<{ date: string; revenue_cents: number }>;
    top_cards: Array<{ name: string; count: number; revenue_cents: number }>;
  };
  promotion: { id: string; code: string; type: string; value: number } | null;
};

const MANIFEST = path.join(__dirname, "../.seed/run.json");

/** Estado compartilhado entre testes serial do lifecycle. */
let sharedState: LifecycleSeed | null = null;

export function loadLifecycleSeed(): LifecycleSeed {
  if (!fs.existsSync(MANIFEST)) {
    throw new Error("Manifest e2e/.seed/run.json ausente — rode npm run seed:test");
  }
  return JSON.parse(fs.readFileSync(MANIFEST, "utf8")) as LifecycleSeed;
}

/** Carrega o manifest uma vez e reutiliza mutações entre specs seriais. */
export function getLifecycleSharedState(): LifecycleSeed {
  if (!sharedState) {
    sharedState = structuredClone(loadLifecycleSeed());
  }
  return sharedState;
}

export function resetLifecycleSharedState() {
  sharedState = null;
}

function persistSharedState() {
  if (!sharedState) return;
  fs.writeFileSync(MANIFEST, JSON.stringify(sharedState, null, 2), "utf8");
}

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

export type LifecycleMockOptions = {
  /** Plano/estado da loja (ex.: free, expired, suspended). */
  storeOverrides?: Partial<LifecycleSeed["store"]> & {
    account_status?: "active" | "suspended" | "expired";
    subscription_plan?: string;
  };
  /** Bloqueia mutações de produto (simula comprador / sem permissão). */
  forbidProductMutations?: boolean;
  /** Respostas 403 em rotas de seller sensíveis. */
  forbidSellerApis?: boolean;
};

/** Instala mocks stateful cobrindo o lifecycle seller completo. */
export async function installLifecycleMocks(page: Page, seedOrOpts?: LifecycleSeed | LifecycleMockOptions) {
  const opts: LifecycleMockOptions =
    seedOrOpts && "runId" in seedOrOpts ? {} : ((seedOrOpts as LifecycleMockOptions | undefined) ?? {});
  const seed = seedOrOpts && "runId" in seedOrOpts ? (seedOrOpts as LifecycleSeed) : getLifecycleSharedState();
  const state = seed;
  if (opts.storeOverrides) {
    Object.assign(state.store, opts.storeOverrides);
  }
  const couponsList: Array<Record<string, unknown>> = [];
  if (state.promotion) {
    couponsList.push({
      id: state.promotion.id,
      code: state.promotion.code,
      discountType: state.promotion.type === "fixed" ? "fixed" : "percentage",
      valueCents: state.promotion.value,
      minOrderCents: 0,
      maxUses: null,
      currentUses: 0,
      isActive: true,
      expiresAt: null,
      createdAt: new Date().toISOString(),
    });
  }

  await page.route("**/api/seller/listings**", (route) =>
    json(route, { listings: [], total: 0 }),
  );
  await page.route("**/api/seller/finance/**", (route) =>
    json(route, { open_count: 0, pending_cents: 0, items: [] }),
  );
  await page.route("**/api/seller/account**", (route) =>
    json(route, { merchant: { kyc_status: "verified" } }),
  );
  await page.route("**/api/account/status**", (route) =>
    json(route, {
      player: {
        account_status: "active",
        cpf_verified: true,
        can_purchase: true,
      },
      merchant: {
        kyc_status: "verified",
        rejection_reason: null,
        can_publish: true,
      },
      user: { role: "seller" },
    }),
  );
  await page.route("**/api/account/**", (route) => {
    if (route.request().url().includes("/status")) {
      return json(route, {
        player: {
          account_status: "active",
          cpf_verified: true,
          can_purchase: true,
        },
        merchant: {
          kyc_status: "verified",
          rejection_reason: null,
          can_publish: true,
        },
        user: { role: "seller" },
      });
    }
    return json(route, { ok: true });
  });

  await page.route("**/api/seller/notifications/header**", (route) =>
    json(route, { items: [], unread: 0 }),
  );
  await page.route("**/api/seller/search/global**", (route) =>
    json(route, { results: [] }),
  );
  await page.route("**/api/stores/mine**", (route) => {
    if (opts.forbidSellerApis) return json(route, { detail: "forbidden" }, 403);
    return json(route, [state.store]);
  });
  await page.route("**/api/seller/dashboard**", async (route) => {
    if (opts.forbidSellerApis) return json(route, { detail: "forbidden" }, 403);
    if (route.request().url().includes("/overview")) {
      const overview = marceloPersonaDashboardOverviewMock();
      overview.metrics.pending_payment = state.orders.filter((o) => o.status === "pending").length;
      overview.recent_orders = state.orders.slice(0, 4).map((o) => ({
        id: o.id,
        status: o.status,
        total_cents: o.total_cents,
        created_at: o.created_at,
        payment_method: o.payment_method,
        customer_name: o.customer_name,
      }));
      return json(route, overview);
    }
    const plan = String(opts.storeOverrides?.subscription_plan ?? state.store.subscription_plan ?? "pro");
    return json(route, {
      store: { ...state.store, subscription_plan: plan },
      kpis: { revenue_cents: state.report.revenue_cents, orders: state.orders.length },
      account_status: opts.storeOverrides?.account_status ?? "active",
    });
  });

  await page.route("**/api/seller/catalog/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.includes("/games")) {
      return json(route, {
        games: [
          { slug: "lorcana", name: "Lorcana", game_code: "LORCANA" },
          { slug: "mtg", name: "Magic", game_code: "MTG" },
          { slug: "pokemon", name: "Pokemon", game_code: "POKEMON" },
          { slug: "onepiece", name: "One Piece", game_code: "ONEPIECE" },
          { slug: "digimon", name: "Digimon", game_code: "DIGIMON" },
          { slug: "swu", name: "Star Wars: Unlimited", game_code: "SWU" },
        ],
      });
    }
    const game = url.searchParams.get("game") || "lorcana";
    const q = (url.searchParams.get("q") || url.searchParams.get("search") || "").toLowerCase();
    const cardName =
      game === "pokemon"
        ? "Pikachu"
        : game === "lorcana"
          ? "Elsa - Snow Queen"
          : game === "onepiece"
            ? "Monkey D. Luffy"
            : game === "digimon"
              ? "Agumon"
              : "Lightning Bolt";
    const cards = [
      {
        id: `${game}-card-1`,
        name: cardName,
        set_name: `${game.toUpperCase()} Set`,
        set_code: game.slice(0, 3).toUpperCase(),
        game_code: game.toUpperCase(),
        rarity: "common",
        image_url: null,
        lowest_price_cents: 199,
      },
    ].filter((c) => !q || c.name.toLowerCase().includes(q) || q.length < 2);
    return json(route, { cards, total: cards.length, page: 1, limit: 24, has_more: false });
  });

  await page.route("**/api/seller/products**", async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const method = req.method();

    if (opts.forbidSellerApis || (opts.forbidProductMutations && method !== "GET")) {
      return json(route, { detail: "forbidden" }, 403);
    }

    if (method === "GET" && !url.pathname.match(/\/products\/[^/]+$/)) {
      return json(route, { products: state.products, total: state.products.length });
    }

    if (method === "POST") {
      const body = req.postDataJSON() as Record<string, unknown>;
      const name = String(body.name ?? "").trim();
      const priceRaw = body.price != null ? Number(body.price) : null;
      const priceCents =
        body.price_cents != null
          ? Number(body.price_cents)
          : priceRaw != null
            ? Math.round(priceRaw * 100)
            : 0;
      const stock = Number(body.quantity ?? body.stock ?? 0);
      if (!name) return json(route, { detail: "name_required" }, 400);
      if (name.length > 255) return json(route, { detail: "name_too_long" }, 400);
      if (!(priceCents >= 1)) return json(route, { detail: "invalid_price" }, 400);
      if (stock < 0) return json(route, { detail: "invalid_stock" }, 400);
      const created = {
        id: `${state.runId}-product-${state.products.length + 1}`,
        name,
        category: String(body.category ?? "sleeve"),
        price_cents: priceCents,
        stock,
        sku: `E2E-${Date.now().toString(36).slice(-5)}`,
        is_active: true,
      };
      state.products.unshift(created);
      state.stock.unshift({
        id: `${created.id}-stock`,
        product_id: created.id,
        title: created.name,
        quantity: created.stock,
        price_cents: created.price_cents,
        kind: "products",
        category: created.category,
      });
      persistSharedState();
      return json(route, created, 201);
    }

    const idMatch = url.pathname.match(/\/products\/([^/]+)$/);
    const productId = idMatch?.[1] ? decodeURIComponent(idMatch[1]) : null;
    if (!productId) return json(route, { detail: "not_found" }, 404);

    if (method === "PATCH") {
      const body = req.postDataJSON() as Record<string, unknown>;
      const idx = state.products.findIndex((p) => p.id === productId);
      if (idx < 0) return json(route, { detail: "not_found" }, 404);
      const cur = state.products[idx];
      const next = {
        ...cur,
        name: body.name != null ? String(body.name) : cur.name,
        price_cents:
          body.price != null
            ? Math.round(Number(body.price) * 100)
            : body.price_cents != null
              ? Number(body.price_cents)
              : cur.price_cents,
        stock: body.quantity != null || body.stock != null ? Number(body.quantity ?? body.stock) : cur.stock,
        category: body.category != null ? String(body.category) : cur.category,
      };
      if (next.price_cents < 1) return json(route, { detail: "invalid_price" }, 400);
      if (next.stock < 0) return json(route, { detail: "invalid_stock" }, 400);
      state.products[idx] = next;
      const stock = state.stock.find((s) => s.product_id === productId);
      if (stock) {
        stock.title = next.name;
        stock.quantity = next.stock;
        stock.price_cents = next.price_cents;
      }
      persistSharedState();
      return json(route, next);
    }

    if (method === "DELETE") {
      const existed = state.products.some((p) => p.id === productId);
      if (!existed) return json(route, { detail: "already_deleted" }, 404);
      state.products = state.products.filter((p) => p.id !== productId);
      state.stock = state.stock.filter((s) => s.product_id !== productId);
      persistSharedState();
      return json(route, { ok: true });
    }

    return json(route, { detail: "method" }, 405);
  });

  await page.route("**/api/seller/inventory/**", async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    if (url.pathname.includes("/search") || url.pathname.endsWith("/inventory")) {
      const items = state.stock.map((s) => ({
        id: s.id,
        title: s.title,
        quantity: s.quantity,
        price_cents: s.price_cents,
        product_id: s.product_id,
        listing_id: null,
        card_id: null,
        kind: "products",
        category: s.category,
        source: "my_catalog",
        language: "pt",
        status: "active",
        health: { score: 80, band: "healthy" },
        health_score: 80,
      }));
      return json(route, { items, total: items.length, page: 1, limit: 48, has_more: false });
    }
    if (url.pathname.includes("/adjust") && req.method() === "POST") {
      const body = req.postDataJSON() as Record<string, unknown>;
      const qty = Number(body.quantity);
      if (Number.isFinite(qty) && qty < 0) {
        return json(route, { detail: "invalid_stock" }, 400);
      }
      const productId = String(body.product_id ?? "");
      const stock = state.stock.find((s) => s.product_id === productId || s.id === String(body.id ?? ""));
      if (stock) {
        if (body.mode === "set" || body.quantity != null) stock.quantity = Number(body.quantity);
        if (body.price_cents != null) stock.price_cents = Number(body.price_cents);
        const prod = state.products.find((p) => p.id === stock.product_id);
        if (prod) {
          prod.stock = stock.quantity;
          prod.price_cents = stock.price_cents;
        }
      }
      persistSharedState();
      return json(route, { ok: true, item: stock ?? null });
    }
    if (url.pathname.includes("/dashboard")) {
      return json(route, {
        actions: [],
        totals: {
          skus: state.stock.length,
          value_cents: state.stock.reduce((a, s) => a + s.price_cents * s.quantity, 0),
        },
      });
    }
    if (url.pathname.includes("/analytics")) {
      return json(route, { kpis: {}, suggestions: [] });
    }
    return json(route, { ok: true });
  });

  await page.route("**/api/seller/orders**", async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const method = req.method();

    if (method === "GET" && !url.pathname.includes("/orders/")) {
      return json(route, { orders: state.orders, total: state.orders.length });
    }

    const idMatch = url.pathname.match(/\/orders\/([^/]+)/);
    const orderId = idMatch?.[1] ? decodeURIComponent(idMatch[1]) : null;
    const order = orderId ? state.orders.find((o) => o.id === orderId) : undefined;

    if (orderId && !order && !url.pathname.includes("/fulfillment")) {
      if (method === "GET" || method === "PATCH") {
        return json(route, { detail: "order_not_found" }, 404);
      }
    }

    if (url.pathname.includes("/fulfillment/commands") && method === "POST") {
      if (!order) return json(route, { detail: "order_not_found" }, 404);
      const body = req.postDataJSON() as { command?: string };
      const cmd = body.command || "";
      if (cmd.includes("picking")) {
        order.status = "processing";
        order.fulfillment_status = "Picking";
      } else if (cmd === "confirm_ship") {
        order.status = "shipped";
        order.fulfillment_status = "Shipped";
      } else if (cmd === "complete" || cmd === "confirm_delivery") {
        order.status = "delivered";
        order.fulfillment_status = "Delivered";
      } else {
        order.status = "processing";
        order.fulfillment_status = "Picking";
      }
      persistSharedState();
      return json(route, { ok: true, order });
    }

    if (url.pathname.includes("/fulfillment") && method === "GET") {
      if (!order) return json(route, { detail: "order_not_found" }, 404);
      return json(route, {
        fulfillment: {
          fulfillment_status: order.fulfillment_status || "Pending",
          shipment_tracking_code: null,
          carrier: null,
          label_url: null,
        },
      });
    }

    if (method === "GET" && order) {
      return json(route, {
        order: {
          ...order,
          items: [
            {
              product_name: state.products[0]?.name ?? "Item E2E",
              quantity: 1,
              unit_price_cents: order.total_cents,
            },
          ],
        },
      });
    }

    if (method === "PATCH" && order) {
      const body = req.postDataJSON() as { status?: string };
      if (body.status) order.status = body.status;
      return json(route, { order });
    }

    return json(route, { orders: state.orders, total: state.orders.length });
  });

  await page.route("**/api/marketplace/shop/stores/*/coupons**", async (route) => {
    const req = route.request();
    const method = req.method();
    if (method === "GET") {
      return json(route, {
        coupons: couponsList,
        total: couponsList.length,
        page: 1,
        limit: 20,
      });
    }
    if (method === "POST") {
      const body = req.postDataJSON() as Record<string, unknown>;
      const code = String(body.code ?? "E2EPROMO").toUpperCase();
      if (couponsList.some((c) => String(c.code).toUpperCase() === code)) {
        return json(route, { detail: "coupon_duplicate" }, 409);
      }
      const expiresAt = body.expires_at ? String(body.expires_at) : null;
      if (expiresAt && new Date(expiresAt).getTime() < Date.now() - 60_000) {
        return json(route, { detail: "coupon_expired" }, 400);
      }
      const created = {
        id: `${state.runId}-promo-${couponsList.length + 1}`,
        code,
        discountType: String(body.type ?? "percentage") === "fixed" ? "fixed" : "percentage",
        valueCents: Number(body.value_cents ?? body.value ?? 10),
        minOrderCents: Number(body.min_order_cents ?? 0),
        maxUses: body.max_uses == null ? null : Number(body.max_uses),
        currentUses: 0,
        isActive: body.is_active !== false,
        expiresAt,
        createdAt: new Date().toISOString(),
      };
      couponsList.unshift(created);
      state.promotion = {
        id: created.id,
        code: created.code,
        type: created.discountType,
        value: created.valueCents,
      };
      persistSharedState();
      return json(route, created, 201);
    }
    return json(route, { ok: true });
  });

  await page.route("**/api/seller/stats**", async (route) =>
    json(route, {
      revenue: { total_cents: state.report.revenue_cents, chart: state.report.chart },
      sales_count: state.report.sales_count,
      unique_buyers: state.report.unique_buyers,
      average_order_value: state.report.average_order_value,
      top_cards: state.report.top_cards,
    }),
  );

  return state;
}
