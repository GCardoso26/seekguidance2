/**
 * Golden Path runner (Sprint 4.4) — official smoke of the first complete product story.
 *
 * Catalog event → Search → Register → Login → Onboard → Inventory → Listing
 *   → Outbox → Publisher → Search → GET /offers
 *
 * Used by: npm run smoke:golden-path · periodic worker · vitest · CI.
 */
import type { Server } from "node:http";
import { createInMemoryAuthenticatedStack } from "../../identity/createInMemoryAuthenticatedStack.js";
import { OutboxPublisherWorker } from "../../platform/outbox/OutboxPublisherWorker.js";
import type { EventPublisher } from "../../platform/event-publisher/EventPublisher.js";
import type { DomainEvent } from "../../shared/events/types.js";
import { createDomainEvent } from "../../shared/events/types.js";
import { SearchEventConsumer } from "../../search/consumer/SearchEventConsumer.js";
import { InMemoryConsumerOffsetRepository } from "../../platform/outbox/ConsumerOffsetRepository.js";
import { InMemorySearchProjectionRepository } from "../../search/persistence/InMemorySearchProjectionRepository.js";
import { getIdGenerator } from "../../shared/ids/IdGenerator.js";
import { getClock } from "../../shared/time/Clock.js";
import { checkBudget, type TimingSample } from "../performanceBudget.js";
import { bizInc, bizObserve, bizGauge } from "../businessMetrics.js";
import { metrics } from "../../platform/metrics/registry.js";

export interface GoldenPathStep {
  id: string;
  ok: boolean;
  detail: string;
  ms?: number;
}

export interface GoldenPathReport {
  passed: boolean;
  steps: GoldenPathStep[];
  timings: TimingSample[];
  deadOutbox: number;
  offerCount: number;
  catalogCardId: string;
}

async function listen(server: Server): Promise<number> {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const addr = server.address();
  return typeof addr === "object" && addr ? addr.port : 0;
}

async function json(
  port: number,
  method: string,
  path: string,
  body?: unknown,
  token?: string,
): Promise<{ status: number; body: Record<string, unknown>; ms: number }> {
  const t0 = getClock().nowMs();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`http://127.0.0.1:${port}${path}`, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return {
    status: res.status,
    body: text ? (JSON.parse(text) as Record<string, unknown>) : {},
    ms: getClock().nowMs() - t0,
  };
}

function step(id: string, ok: boolean, detail: string, ms?: number): GoldenPathStep {
  return { id, ok, detail, ms };
}

/**
 * Runs the full golden path in-process (InMemory stacks + Search projection).
 * Suitable for CI — no Docker required. Exit non-zero when `passed === false`.
 */
export async function runGoldenPathSmoke(): Promise<GoldenPathReport> {
  metrics.reset();
  const steps: GoldenPathStep[] = [];
  const timings: TimingSample[] = [];

  const stack = createInMemoryAuthenticatedStack({ jwtSecret: "smoke-jwt-secret!!" });
  const server = stack.createServer();
  const port = await listen(server);

  const projection = new InMemorySearchProjectionRepository();
  await projection.ensureIndex();
  const offsets = new InMemoryConsumerOffsetRepository();
  const consumer = new SearchEventConsumer(projection, offsets);
  const published: DomainEvent[] = [];
  const publisher: EventPublisher = {
    async publish(event) {
      published.push(event);
      await consumer.handle(event);
    },
  };
  const outboxWorker = new OutboxPublisherWorker(stack.marketplace.outbox, publisher, {
    workerId: "golden-path-publisher",
  });

  const email = `smoke-${getIdGenerator().generate().slice(0, 8)}@example.com`;
  const password = "smoke-pass-1!";
  const cardId = getIdGenerator().generate();
  const variantId = getIdGenerator().generate();
  const firstListingT0 = getClock().nowMs();

  try {
    // ── 1. Catalog → Search (provider sync proxy) ─────────────────────────
    const catalogEv = createDomainEvent(
      "CardUpdated",
      cardId,
      {
        name: "Smoke Bolt",
        normalizedName: "smoke bolt",
        setCode: "SMK",
        language: "en",
        rarity: "common",
      },
      { id: getIdGenerator().generate(), aggregateType: "catalog_card" },
    );
    const catT0 = getClock().nowMs();
    const catResult = await consumer.handle(catalogEv);
    const catMs = getClock().nowMs() - catT0;
    bizObserve("search_provider_to_search_ms", catMs);
    steps.push(
      step(
        "catalog_to_search",
        catResult === "applied",
        `CardUpdated → projection (${catResult})`,
        catMs,
      ),
    );

    // ── 2. Register ───────────────────────────────────────────────────────
    const reg = await json(port, "POST", "/api/v1/auth/register", {
      email,
      displayName: "Smoke Seller",
      password,
    });
    bizInc("identity_register_total");
    steps.push(step("register", reg.status === 201, `status=${reg.status}`, reg.ms));

    // ── 3. Login ──────────────────────────────────────────────────────────
    const login = await json(port, "POST", "/api/v1/auth/login", { email, password });
    bizInc("identity_login_total");
    const loginBudget = checkBudget("loginMs", login.ms);
    timings.push(loginBudget);
    const accessToken = login.body.accessToken as string;
    const refreshToken = login.body.refreshToken as string;
    steps.push(
      step(
        "login",
        login.status === 200 && !!accessToken && loginBudget.ok,
        `status=${login.status} budget=${loginBudget.ok}`,
        login.ms,
      ),
    );

    // ── 4. Buyer forbidden ────────────────────────────────────────────────
    const forbidden = await json(
      port,
      "POST",
      "/api/v1/marketplace/listings",
      { catalogCardId: cardId, catalogVariantId: variantId, priceCents: 100, condition: "NM", quantity: 1 },
      accessToken,
    );
    if (forbidden.status === 403) bizInc("identity_auth_403_total");
    steps.push(step("buyer_forbidden", forbidden.status === 403, `status=${forbidden.status}`));

    // ── 5. Onboard seller ─────────────────────────────────────────────────
    const onboard = await json(
      port,
      "POST",
      "/api/v1/marketplace/sellers",
      { displayName: "Smoke Shop" },
      accessToken,
    );
    steps.push(step("onboard_seller", onboard.status === 201, `sellerId=${onboard.body.sellerId}`));

    // ── 6. Inventory ──────────────────────────────────────────────────────
    const inv = await json(
      port,
      "POST",
      "/api/v1/marketplace/inventory",
      { catalogCardId: cardId, catalogVariantId: variantId, quantity: 3 },
      accessToken,
    );
    steps.push(step("inventory", inv.status === 201 && inv.body.quantity === 3, `qty=${inv.body.quantity}`));

    // ── 7. Publish listing ────────────────────────────────────────────────
    const listingT0 = getClock().nowMs();
    const listing = await json(
      port,
      "POST",
      "/api/v1/marketplace/listings",
      {
        catalogCardId: cardId,
        catalogVariantId: variantId,
        inventoryItemId: inv.body.id,
        priceCents: 2500,
        condition: "NM",
        language: "en",
        finish: "nonfoil",
        quantity: 2,
        status: "active",
      },
      accessToken,
    );
    const publishMs = getClock().nowMs() - listingT0;
    const publishBudget = checkBudget("publishListingMs", publishMs);
    timings.push(publishBudget);
    bizInc("marketplace_listings_published_total");
    bizObserve("marketplace_first_listing_ms", getClock().nowMs() - firstListingT0);
    steps.push(
      step(
        "publish_listing",
        listing.status === 201 && publishBudget.ok,
        `status=${listing.status} budget=${publishBudget.ok}`,
        publishMs,
      ),
    );

    // ── 8. Outbox pending → publish → Search ──────────────────────────────
    const pending = await stack.marketplace.outbox.countByStatus("pending");
    steps.push(step("outbox_pending", pending > 0, `pending=${pending}`));

    const listingSearchT0 = getClock().nowMs();
    const tick = await outboxWorker.tick();
    const listingToSearchMs = getClock().nowMs() - listingSearchT0;
    const listingSearchBudget = checkBudget("listingToSearchMs", listingToSearchMs);
    timings.push(listingSearchBudget);
    bizObserve("marketplace_listing_to_searchable_ms", listingToSearchMs);
    bizObserve("search_listing_to_search_ms", listingToSearchMs);
    steps.push(
      step(
        "outbox_to_search",
        tick.published > 0 &&
          tick.dead === 0 &&
          published.some((e) => e.eventType === "MarketplaceListingUpdated") &&
          listingSearchBudget.ok,
        `published=${tick.published} dead=${tick.dead} ms=${listingToSearchMs}`,
        listingToSearchMs,
      ),
    );

    // ── 9. Replay idempotent ──────────────────────────────────────────────
    const tick2 = await outboxWorker.tick();
    const replay = published[0] ? await consumer.handle(published[0]) : "failed";
    steps.push(
      step(
        "replay_idempotent",
        tick2.published === 0 && replay === "skipped",
        `tick2.published=${tick2.published} replay=${replay}`,
      ),
    );

    // ── 10. GET /offers ───────────────────────────────────────────────────
    const offers = await json(port, "GET", `/api/v1/marketplace/cards/${cardId}/offers`);
    const offersBudget = checkBudget("getOffersMs", offers.ms);
    timings.push(offersBudget);
    bizObserve("offers_get_latency_ms", offers.ms);
    const offerCount = Number(offers.body.offerCount ?? 0);
    bizGauge("marketplace_listings_active", offerCount);
    steps.push(
      step(
        "get_offers",
        offers.status === 200 && offerCount === 1 && offers.body.bestPriceCents === 2500 && offersBudget.ok,
        `offerCount=${offerCount} best=${offers.body.bestPriceCents} budget=${offersBudget.ok}`,
        offers.ms,
      ),
    );

    // ── 11. Refresh + Logout ──────────────────────────────────────────────
    const refreshed = await json(port, "POST", "/api/v1/auth/refresh", { refreshToken });
    bizInc("identity_refresh_total");
    steps.push(step("refresh", refreshed.status === 200, `status=${refreshed.status}`));

    await json(port, "POST", "/api/v1/auth/logout", { refreshToken });
    bizInc("identity_logout_total");
    const afterLogout = await json(port, "POST", "/api/v1/auth/refresh", { refreshToken });
    if (afterLogout.status === 401) bizInc("identity_auth_401_total");
    steps.push(step("logout", afterLogout.status === 401, `refresh_after_logout=${afterLogout.status}`));

    const deadOutbox = await stack.marketplace.outbox.countByStatus("dead");
    steps.push(step("zero_dead", deadOutbox === 0, `dead=${deadOutbox}`));

    const passed = steps.every((s) => s.ok);
    return {
      passed,
      steps,
      timings,
      deadOutbox,
      offerCount,
      catalogCardId: cardId,
    };
  } finally {
    outboxWorker.stop();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

export function formatGoldenPathReport(report: GoldenPathReport): string {
  const lines = [
    `Golden Path Smoke — ${report.passed ? "PASSED" : "FAILED"}`,
    `offers=${report.offerCount} dead=${report.deadOutbox} card=${report.catalogCardId}`,
    "",
    "Steps:",
    ...report.steps.map(
      (s) => `  ${s.ok ? "✓" : "✗"} ${s.id}${s.ms != null ? ` (${s.ms}ms)` : ""} — ${s.detail}`,
    ),
    "",
    "Budgets:",
    ...report.timings.map(
      (t) =>
        `  ${t.ok ? "✓" : "✗"} ${t.name}: ${t.ms}ms` +
        (t.budgetMs != null ? ` / budget ${t.budgetMs}ms` : ""),
    ),
  ];
  return lines.join("\n");
}
