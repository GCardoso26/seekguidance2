import type { IncomingMessage, ServerResponse } from "node:http";
import { createServer, type Server } from "node:http";
import { getIdGenerator } from "../../shared/ids/IdGenerator.js";
import type { RegisterUserApplicationService } from "../application/RegisterUserApplicationService.js";
import type { LoginApplicationService } from "../application/LoginApplicationService.js";
import type { RefreshSessionApplicationService } from "../application/RefreshSessionApplicationService.js";
import type { LogoutApplicationService } from "../application/LogoutApplicationService.js";
import type { OnboardSellerApplicationService } from "../application/OnboardSellerApplicationService.js";
import type { AuthMiddleware } from "./authMiddleware.js";
import { AuthError } from "./authMiddleware.js";
import { readJsonBody, readUrl, sendJson, str } from "./httpHelpers.js";
import type { MarketplaceQueryService } from "../../marketplace/read/MarketplaceQueryService.js";
import type { PublishListingApplicationService } from "../../marketplace/application/PublishListingApplicationService.js";
import type { AdjustInventoryApplicationService } from "../../marketplace/application/AdjustInventoryApplicationService.js";
import type { SellerProfileRepository } from "../domain/SellerProfileRepository.js";
import type { TransactionManager } from "../../platform/transaction/types.js";
import {
  toCardOffersResponse,
  toListingResponse,
  toSellerResponse,
} from "../../marketplace/read/mappers.js";
import { bizInc } from "../../ops/businessMetrics.js";
import {
  handleCheckoutApi,
  mapCheckoutDomainError,
  type CheckoutHttpDeps,
} from "../../order/http/checkoutHandlers.js";
import {
  handlePaymentWebhookApi,
  mapPaymentWebhookError,
  type PaymentWebhookHttpDeps,
} from "../../payment/api/webhookHandlers.js";
import {
  handleObservabilityHttp,
  inMemoryHealthDeps,
  type HealthDeps,
} from "../../observability/http/health.js";

export interface AuthenticatedApiDeps {
  registerUser: RegisterUserApplicationService;
  login: LoginApplicationService;
  refresh: RefreshSessionApplicationService;
  logout: LogoutApplicationService;
  onboardSeller: OnboardSellerApplicationService;
  auth: AuthMiddleware;
  identityTx: TransactionManager;
  profiles: SellerProfileRepository;
  queries: MarketplaceQueryService;
  publishListing: PublishListingApplicationService;
  adjustInventory: AdjustInventoryApplicationService;
  /** Sprint 5.4 — optional until checkout stack is wired. */
  checkout?: CheckoutHttpDeps;
  /** Sprint 5.5 — Fake payment webhook simulation. */
  paymentWebhook?: PaymentWebhookHttpDeps;
  /** Sprint 6 — readiness probes (defaults to in-memory green). */
  health?: HealthDeps;
}

/**
 * Sprint 4.3 — first complete marketplace story.
 * Auth + Marketplace read/write. Controllers are thin: call AS only.
 *
 * POST /api/v1/auth/register|login|refresh|logout
 * POST /api/v1/marketplace/sellers          (onboard)
 * POST|PATCH|DELETE /api/v1/marketplace/inventory
 * POST|PATCH|DELETE /api/v1/marketplace/listings
 * GET  /api/v1/marketplace/...              (read)
 */
export function createAuthenticatedApiServer(deps: AuthenticatedApiDeps): Server {
  return createServer(async (req, res) => {
    try {
      const url = readUrl(req);
      const path = url.pathname.replace(/\/$/, "") || "/";
      const method = req.method ?? "GET";

      if (
        await handleObservabilityHttp(
          deps.health ?? inMemoryHealthDeps(),
          req,
          res,
          path,
          method,
        )
      ) {
        return;
      }

      // ── Auth ──────────────────────────────────────────────────────────
      if (path === "/api/v1/auth/register" && method === "POST") {
        await handleRegister(deps, req, res);
        return;
      }
      if (path === "/api/v1/auth/login" && method === "POST") {
        await handleLogin(deps, req, res);
        return;
      }
      if (path === "/api/v1/auth/refresh" && method === "POST") {
        await handleRefresh(deps, req, res);
        return;
      }
      if (path === "/api/v1/auth/logout" && method === "POST") {
        await handleLogout(deps, req, res);
        return;
      }

      // ── Marketplace write (authenticated) ─────────────────────────────
      if (path === "/api/v1/marketplace/sellers" && method === "POST") {
        await handleOnboardSeller(deps, req, res);
        return;
      }
      if (path === "/api/v1/marketplace/inventory" && method === "POST") {
        await handleInventoryWrite(deps, req, res, "create");
        return;
      }
      if (path === "/api/v1/marketplace/inventory" && method === "PATCH") {
        await handleInventoryWrite(deps, req, res, "update");
        return;
      }
      if (path === "/api/v1/marketplace/inventory" && method === "DELETE") {
        await handleInventoryWrite(deps, req, res, "delete");
        return;
      }
      if (path === "/api/v1/marketplace/listings" && method === "POST") {
        await handleListingWrite(deps, req, res, "create");
        return;
      }
      if (/^\/api\/v1\/marketplace\/listings\/[^/]+$/.test(path) && method === "PATCH") {
        await handleListingWrite(deps, req, res, "update", path);
        return;
      }
      if (/^\/api\/v1\/marketplace\/listings\/[^/]+$/.test(path) && method === "DELETE") {
        await handleListingWrite(deps, req, res, "delete", path);
        return;
      }

      // ── Marketplace read (public) ─────────────────────────────────────
      if (method === "GET" || method === "HEAD") {
        const handled = await handleMarketplaceRead(deps, req, res, path, url);
        if (handled) return;
      }

      // ── Checkout API (Sprint 5.4) ─────────────────────────────────────
      if (deps.checkout) {
        const handled = await handleCheckoutApi(deps.checkout, req, res, path, method);
        if (handled) return;
      }

      // ── Payment webhook simulation (Sprint 5.5) ───────────────────────
      if (deps.paymentWebhook) {
        const handled = await handlePaymentWebhookApi(
          deps.paymentWebhook,
          req,
          res,
          path,
          method,
        );
        if (handled) return;
      }

      if (method !== "GET" && method !== "HEAD" && method !== "POST" && method !== "PATCH" && method !== "DELETE") {
        sendJson(res, 405, { error: "method_not_allowed" });
        return;
      }
      sendJson(res, 404, { error: "not_found" });
    } catch (err) {
      if (err instanceof AuthError) {
        if (err.status === 401) bizInc("identity_auth_401_total");
        if (err.status === 403) bizInc("identity_auth_403_total");
        sendJson(res, err.status, { error: err.code });
        return;
      }
      const message = err instanceof Error ? err.message : String(err);
      if (message === "invalid_json") {
        sendJson(res, 400, { error: "invalid_json" });
        return;
      }
      if (message === "invalid_credentials") {
        sendJson(res, 401, { error: "invalid_credentials" });
        return;
      }
      if (message === "email_taken") {
        sendJson(res, 409, { error: "email_taken" });
        return;
      }
      if (message === "password_required") {
        sendJson(res, 400, { error: "password_required" });
        return;
      }
      const checkoutErr = mapCheckoutDomainError(message);
      if (checkoutErr) {
        sendJson(res, checkoutErr.status, { error: checkoutErr.error });
        return;
      }
      const paymentErr = mapPaymentWebhookError(message);
      if (paymentErr) {
        sendJson(res, paymentErr.status, { error: paymentErr.error });
        return;
      }
      sendJson(res, 500, { error: "internal_error", message });
    }
  });
}

export async function listenAuthenticatedApi(
  deps: AuthenticatedApiDeps,
  port?: number,
): Promise<{ server: Server; port: number }> {
  const p = port ?? Number(process.env.AUTH_API_PORT ?? "8789");
  const server = createAuthenticatedApiServer(deps);
  await new Promise<void>((resolve) => server.listen(p, resolve));
  return { server, port: p };
}

// ── Handlers (thin) ─────────────────────────────────────────────────────────

async function handleRegister(
  deps: AuthenticatedApiDeps,
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const body = await readJsonBody(req);
  const email = str(body, "email");
  const displayName = str(body, "displayName");
  const password = str(body, "password");
  if (!email || !displayName || !password) {
    sendJson(res, 400, { error: "email_displayName_password_required" });
    return;
  }
  const result = await deps.registerUser.execute({ email, displayName, password });
  bizInc("identity_register_total");
  sendJson(res, 201, {
    id: result.entity.id,
    email: result.entity.email,
    displayName: result.entity.displayName,
  });
}

async function handleLogin(
  deps: AuthenticatedApiDeps,
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const body = await readJsonBody(req);
  const email = str(body, "email");
  const password = str(body, "password");
  if (!email || !password) {
    sendJson(res, 400, { error: "email_password_required" });
    return;
  }
  const tokens = await deps.login.execute({ email, password });
  bizInc("identity_login_total");
  sendJson(res, 200, tokens);
}

async function handleRefresh(
  deps: AuthenticatedApiDeps,
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const body = await readJsonBody(req);
  const refreshToken = str(body, "refreshToken");
  if (!refreshToken) {
    sendJson(res, 400, { error: "refreshToken_required" });
    return;
  }
  try {
    const tokens = await deps.refresh.execute(refreshToken);
    bizInc("identity_refresh_total");
    sendJson(res, 200, tokens);
  } catch (err) {
    const code = err instanceof Error ? err.message : "invalid_token";
    sendJson(res, 401, { error: code });
  }
}

async function handleLogout(
  deps: AuthenticatedApiDeps,
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const body = await readJsonBody(req);
  const token =
    str(body, "refreshToken") ??
    str(body, "accessToken") ??
    req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) {
    sendJson(res, 400, { error: "token_required" });
    return;
  }
  await deps.logout.execute(token);
  bizInc("identity_logout_total");
  sendJson(res, 200, { ok: true });
}

async function handleOnboardSeller(
  deps: AuthenticatedApiDeps,
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const user = await deps.auth.requireAuth(req);
  const body = await readJsonBody(req);
  const displayName = str(body, "displayName");
  if (!displayName) {
    sendJson(res, 400, { error: "displayName_required" });
    return;
  }
  const result = await deps.onboardSeller.execute({
    userId: user.userId,
    displayName,
    slug: str(body, "slug"),
  });
  sendJson(res, 201, {
    sellerId: result.seller.id,
    slug: result.seller.slug,
    displayName: result.seller.displayName,
    profileId: result.profile.id,
  });
}

async function resolveSellerId(
  deps: AuthenticatedApiDeps,
  userId: string,
): Promise<string | null> {
  const profile = await deps.identityTx.runInTransaction((t) =>
    deps.profiles.findByUserId(t, userId),
  );
  return profile?.sellerId ?? null;
}

async function handleInventoryWrite(
  deps: AuthenticatedApiDeps,
  req: IncomingMessage,
  res: ServerResponse,
  mode: "create" | "update" | "delete",
): Promise<void> {
  const user = await deps.auth.requirePermission(req, "inventory:write");
  const sellerId = await resolveSellerId(deps, user.userId);
  if (!sellerId) {
    sendJson(res, 403, { error: "not_a_seller" });
    return;
  }
  const body = await readJsonBody(req);
  const catalogCardId = str(body, "catalogCardId");
  const catalogVariantId = str(body, "catalogVariantId");
  if (!catalogCardId || !catalogVariantId) {
    sendJson(res, 400, { error: "catalogCardId_catalogVariantId_required" });
    return;
  }
  const quantity =
    mode === "delete" ? 0 : typeof body.quantity === "number" ? body.quantity : undefined;
  if (quantity == null || quantity < 0) {
    sendJson(res, 400, { error: "quantity_required" });
    return;
  }
  const result = await deps.adjustInventory.execute({
    sellerId,
    catalogCardId,
    catalogVariantId,
    quantity,
    id: str(body, "id"),
  });
  sendJson(res, mode === "create" ? 201 : 200, {
    id: result.entity.id,
    quantity: result.entity.quantity,
    outcome: result.outcome,
  });
}

async function handleListingWrite(
  deps: AuthenticatedApiDeps,
  req: IncomingMessage,
  res: ServerResponse,
  mode: "create" | "update" | "delete",
  path?: string,
): Promise<void> {
  const permission = mode === "delete" ? "listing:delete" : "listing:write";
  const user = await deps.auth.requirePermission(req, permission);
  const sellerId = await resolveSellerId(deps, user.userId);
  if (!sellerId) {
    sendJson(res, 403, { error: "not_a_seller" });
    return;
  }

  const listingId =
    path != null ? decodeURIComponent(path.split("/").pop()!) : undefined;
  const body = mode === "delete" ? {} : await readJsonBody(req);
  const requestId = getIdGenerator().generate();

  if (mode === "delete") {
    if (!listingId) {
      sendJson(res, 400, { error: "listing_id_required" });
      return;
    }
    const existing = await deps.queries.getListing(listingId);
    if (!existing || existing.sellerId !== sellerId) {
      sendJson(res, 404, { error: "listing_not_found" });
      return;
    }
    const result = await deps.publishListing.execute({
      requestId,
      listing: {
        id: listingId,
        sellerId,
        catalogCardId: existing.catalogCardId,
        catalogVariantId: existing.catalogVariantId,
        inventoryItemId: existing.inventoryItemId,
        priceCents: existing.priceCents,
        currency: existing.currency,
        condition: existing.condition,
        language: existing.language,
        notes: existing.notes,
        finish: existing.finish,
        quantity: 0,
        status: "paused",
        expectedVersion: existing.rowVersion,
      },
    });
    sendJson(res, 200, { id: result.entity.id, status: result.entity.status, outcome: result.outcome });
    return;
  }

  if (mode === "update") {
    if (!listingId) {
      sendJson(res, 400, { error: "listing_id_required" });
      return;
    }
    const existing = await deps.queries.getListing(listingId);
    if (!existing || existing.sellerId !== sellerId) {
      sendJson(res, 404, { error: "listing_not_found" });
      return;
    }
    const result = await deps.publishListing.execute({
      requestId,
      listing: {
        id: listingId,
        sellerId,
        catalogCardId: existing.catalogCardId,
        catalogVariantId: existing.catalogVariantId,
        inventoryItemId: existing.inventoryItemId,
        priceCents: typeof body.priceCents === "number" ? body.priceCents : existing.priceCents,
        currency: existing.currency,
        condition: str(body, "condition") ?? existing.condition,
        language: str(body, "language") ?? existing.language,
        notes: str(body, "notes") ?? existing.notes,
        finish: str(body, "finish") ?? existing.finish,
        quantity: typeof body.quantity === "number" ? body.quantity : existing.quantity,
        status: (str(body, "status") as typeof existing.status) ?? existing.status,
        expectedVersion: existing.rowVersion,
      },
    });
    sendJson(res, 200, toListingResponse(result.entity));
    return;
  }

  // create
  const catalogCardId = str(body, "catalogCardId");
  const catalogVariantId = str(body, "catalogVariantId");
  const condition = str(body, "condition");
  const language = str(body, "language") ?? "en";
  const priceCents = typeof body.priceCents === "number" ? body.priceCents : undefined;
  const quantity = typeof body.quantity === "number" ? body.quantity : undefined;
  if (!catalogCardId || !catalogVariantId || !condition || priceCents == null || quantity == null) {
    sendJson(res, 400, {
      error: "catalogCardId_catalogVariantId_condition_priceCents_quantity_required",
    });
    return;
  }
  const result = await deps.publishListing.execute({
    requestId,
    listing: {
      sellerId,
      catalogCardId,
      catalogVariantId,
      inventoryItemId: str(body, "inventoryItemId") ?? null,
      priceCents,
      condition,
      language,
      notes: str(body, "notes") ?? null,
      finish: str(body, "finish") ?? null,
      quantity,
      status: (str(body, "status") as "draft" | "active") ?? "active",
    },
  });
  sendJson(res, 201, toListingResponse(result.entity));
  bizInc("marketplace_listings_published_total");
}

async function handleMarketplaceRead(
  deps: AuthenticatedApiDeps,
  _req: IncomingMessage,
  res: ServerResponse,
  path: string,
  url: URL,
): Promise<boolean> {
  if (path === "/api/v1/marketplace/listings") {
    const cardId = url.searchParams.get("cardId");
    if (!cardId) {
      sendJson(res, 400, { error: "cardId_required" });
      return true;
    }
    const offers = await deps.queries.listCardOffers(cardId);
    sendJson(res, 200, { items: offers.map(toListingResponse) });
    return true;
  }

  const listingMatch = /^\/api\/v1\/marketplace\/listings\/([^/]+)$/.exec(path);
  if (listingMatch) {
    const listing = await deps.queries.getListing(decodeURIComponent(listingMatch[1]!));
    if (!listing) {
      sendJson(res, 404, { error: "listing_not_found" });
      return true;
    }
    sendJson(res, 200, toListingResponse(listing));
    return true;
  }

  const cardOffersMatch = /^\/api\/v1\/marketplace\/cards\/([^/]+)\/offers$/.exec(path);
  if (cardOffersMatch) {
    const cardId = decodeURIComponent(cardOffersMatch[1]!);
    const offers = await deps.queries.listCardOffers(cardId);
    sendJson(res, 200, toCardOffersResponse(cardId, offers));
    return true;
  }

  const sellerListingsMatch = /^\/api\/v1\/marketplace\/sellers\/([^/]+)\/listings$/.exec(path);
  if (sellerListingsMatch) {
    const sellerId = decodeURIComponent(sellerListingsMatch[1]!);
    const listings = await deps.queries.listSellerListings(sellerId);
    sendJson(res, 200, { items: listings.map(toListingResponse) });
    return true;
  }

  const sellerMatch = /^\/api\/v1\/marketplace\/sellers\/([^/]+)$/.exec(path);
  if (sellerMatch) {
    const seller = await deps.queries.getSeller(decodeURIComponent(sellerMatch[1]!));
    if (!seller) {
      sendJson(res, 404, { error: "seller_not_found" });
      return true;
    }
    sendJson(res, 200, toSellerResponse(seller));
    return true;
  }

  return false;
}
