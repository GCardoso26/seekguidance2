/**
 * Checkout BC V2 HTTP API — Identity + Marketplace + /api/v1/checkout-v2/*
 *
 * Usage:
 *   cd services/api
 *   npm run api:checkout-v2
 *
 * Env:
 *   DATABASE_URL              (required — loaded from services/api/.env if unset)
 *   JWT_SECRET                (optional)
 *   CHECKOUT_V2_API_PORT      (default 8791)
 *   CHECKOUT_PAYMENT_GATEWAY  stub|stripe|mercado_pago (default stub)
 *   CHECKOUT_V2_FORCE         1 (default) — force feature flag ON
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createLogger } from "../platform/logging/logger.js";
import { createCheckoutV2ApiStack } from "../checkout/createCheckoutV2ApiStack.js";

const log = createLogger("checkout-v2-api");

/** Load KEY=VALUE from services/api/.env into process.env (does not override existing). */
function loadDotEnv(): void {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  const envPath = path.join(root, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 1) continue;
    const key = t.slice(0, i).trim();
    const val = t.slice(i + 1).trim().replace(/^["']|["']$/g, "");
    if (!(key in process.env) || process.env[key] === "") {
      process.env[key] = val;
    }
  }
}

async function main(): Promise<void> {
  loadDotEnv();
  const port = Number(
    process.env.CHECKOUT_V2_API_PORT ?? process.env.AUTH_API_PORT ?? "8791",
  );
  const force = process.env.CHECKOUT_V2_FORCE !== "0";

  const stack = createCheckoutV2ApiStack({
    jwtSecret: process.env.JWT_SECRET ?? "dev-checkout-v2-jwt-secret!!",
    forceCheckoutV2: force,
  });

  const { port: bound } = await stack.listen(port);
  log.info(
    {
      port: bound,
      paymentGateway: process.env.CHECKOUT_PAYMENT_GATEWAY ?? "stub",
      checkoutV2Forced: force,
      routes: [
        "GET  /health",
        "POST /api/v1/auth/register|login|refresh|logout",
        "POST /api/v1/checkout-v2/cart",
        "POST /api/v1/checkout-v2/sessions",
        "POST /api/v1/checkout-v2/sessions/:id/confirm-payment",
        "POST /api/v1/checkout-v2/webhooks/:provider",
      ],
    },
    "checkout_v2_api_started",
  );

  const shutdown = async (signal: string) => {
    log.info({ signal }, "checkout_v2_api_shutdown");
    await stack.close();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((err) => {
  log.error({ err: String(err) }, "checkout_v2_api_boot_failed");
  process.exit(1);
});
