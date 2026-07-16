/**
 * Authenticated Marketplace API — Sprint 4.3.
 * Auth + write + read. First complete product story.
 */
import { createLogger } from "../platform/logging/logger.js";
import { createInMemoryAuthenticatedStack } from "../identity/createInMemoryAuthenticatedStack.js";

const log = createLogger("auth-api");

async function main(): Promise<void> {
  const secret = process.env.JWT_SECRET ?? "dev-jwt-secret-change-me!";
  const stack = createInMemoryAuthenticatedStack({ jwtSecret: secret });
  const { port } = await stack.listen();
  log.info(
    {
      port,
      routes: [
        "POST /api/v1/auth/register",
        "POST /api/v1/auth/login",
        "POST /api/v1/auth/refresh",
        "POST /api/v1/auth/logout",
        "POST /api/v1/marketplace/sellers",
        "POST|PATCH|DELETE /api/v1/marketplace/inventory",
        "POST|PATCH|DELETE /api/v1/marketplace/listings",
        "GET  /api/v1/marketplace/cards/:id/offers",
      ],
    },
    "authenticated_api_started",
  );
}

main().catch((err) => {
  log.error({ err: String(err) }, "authenticated_api_boot_failed");
  process.exit(1);
});
