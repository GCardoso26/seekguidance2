import { createInMemoryIdentityStack } from "./createInMemoryIdentityStack.js";
import { createInMemoryMarketplaceStack } from "../marketplace/createInMemoryMarketplaceStack.js";
import { OnboardSellerApplicationService } from "./application/OnboardSellerApplicationService.js";
import {
  createAuthenticatedApiServer,
  listenAuthenticatedApi,
  type AuthenticatedApiDeps,
} from "./http/createAuthenticatedApiServer.js";

/**
 * Composition root — Identity + Marketplace for the authenticated API (Sprint 4.3).
 * Wires OnboardSeller across both bounded contexts.
 */
export function createInMemoryAuthenticatedStack(opts?: { jwtSecret?: string }) {
  const identity = createInMemoryIdentityStack(opts);
  const marketplace = createInMemoryMarketplaceStack();
  const onboardSeller = new OnboardSellerApplicationService(
    marketplace.tx,
    identity.tx,
    marketplace.sellers,
    identity.profiles,
    identity.roles,
  );

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
  };

  return {
    identity,
    marketplace,
    onboardSeller,
    deps,
    createServer: () => createAuthenticatedApiServer(deps),
    listen: (port?: number) => listenAuthenticatedApi(deps, port),
  };
}
