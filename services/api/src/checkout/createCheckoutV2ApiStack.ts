import { Pool } from "pg";
import { createInMemoryIdentityStack } from "../identity/createInMemoryIdentityStack.js";
import { createInMemoryMarketplaceStack } from "../marketplace/createInMemoryMarketplaceStack.js";
import { OnboardSellerApplicationService } from "../identity/application/OnboardSellerApplicationService.js";
import {
  createAuthenticatedApiServer,
  listenAuthenticatedApi,
  type AuthenticatedApiDeps,
} from "../identity/http/createAuthenticatedApiServer.js";
import { InMemoryFeatureFlagService } from "../platform/feature-flags/FeatureFlagService.js";
import { createCheckoutService } from "./application/CheckoutService.js";
import { createPaymentGateway } from "./application/payment/createPaymentGateway.js";
import { postgresCheckoutHealthDeps } from "../observability/http/health.js";

/**
 * Normalize SQLAlchemy-style URLs (postgresql+asyncpg://) for node-pg.
 */
export function toNodePgConnectionString(url: string): string {
  return url.replace(/^postgresql\+asyncpg:/i, "postgresql:");
}

export interface CheckoutV2ApiStackOpts {
  jwtSecret?: string;
  /** Defaults to DATABASE_URL. Required — CheckoutService persists to Postgres. */
  databaseUrl?: string;
  /** Force checkout_v2 flag ON (default true for this API). */
  forceCheckoutV2?: boolean;
  /** Payment gateway name; default CHECKOUT_PAYMENT_GATEWAY or stub. */
  paymentGateway?: string;
}

/**
 * Composition root — Identity (in-memory) + Marketplace (in-memory) + Checkout BC V2 (Postgres).
 *
 * Auth/register/login live in this process (JWT local).
 * Cart/session/payment intents persist via CheckoutService → DATABASE_URL.
 * Listings for addToCart are read from Postgres marketplace tables.
 */
export function createCheckoutV2ApiStack(opts: CheckoutV2ApiStackOpts = {}) {
  const rawUrl = opts.databaseUrl ?? process.env.DATABASE_URL;
  if (!rawUrl) {
    throw new Error("DATABASE_URL required for Checkout V2 API");
  }

  const pool = new Pool({ connectionString: toNodePgConnectionString(rawUrl) });
  const identity = createInMemoryIdentityStack({ jwtSecret: opts.jwtSecret });
  const marketplace = createInMemoryMarketplaceStack();
  const onboardSeller = new OnboardSellerApplicationService(
    marketplace.tx,
    identity.tx,
    marketplace.sellers,
    identity.profiles,
    identity.roles,
  );

  const force = opts.forceCheckoutV2 !== false;
  const gatewayName =
    opts.paymentGateway ?? process.env.CHECKOUT_PAYMENT_GATEWAY ?? "stub";

  const checkout = createCheckoutService(pool, {
    flags: force
      ? new InMemoryFeatureFlagService({ checkout_v2: true })
      : undefined,
    payment: createPaymentGateway(gatewayName),
  });

  const deps: AuthenticatedApiDeps = {
    registerUser: identity.registerUser,
    login: identity.login,
    refresh: identity.refresh,
    logout: identity.logout,
    onboardSeller,
    auth: identity.auth,
    identityTx: identity.tx,
    profiles: identity.profiles,
    queries: marketplace.queries,
    publishListing: marketplace.publishListing,
    adjustInventory: marketplace.adjustInventory,
    checkoutV2: { auth: identity.auth, checkout },
    /** BUG-QA-001 — never advertise in_memory when Checkout V2 uses Postgres. */
    health: postgresCheckoutHealthDeps({
      query: async (sql) => {
        await pool.query(sql);
      },
      checkOutbox: async () => {
        try {
          await pool.query(
            `SELECT 1 FROM platform.outbox_events LIMIT 1`,
          );
          return { name: "outbox", ok: true, detail: "postgres_accessible" };
        } catch (err) {
          return {
            name: "outbox",
            ok: false,
            detail: err instanceof Error ? err.message : String(err),
          };
        }
      },
    }),
  };

  return {
    pool,
    identity,
    marketplace,
    checkout,
    deps,
    createServer: () => createAuthenticatedApiServer(deps),
    listen: (port?: number) => listenAuthenticatedApi(deps, port),
    async close(): Promise<void> {
      await pool.end();
    },
  };
}

export type CheckoutV2ApiStack = ReturnType<typeof createCheckoutV2ApiStack>;
