import { InMemoryTransactionManager } from "../platform/transaction/InMemoryTransactionManager.js";
import { createIdentityApplicationServices } from "./application/createIdentityApplicationServices.js";
import { LoginApplicationService } from "./application/LoginApplicationService.js";
import { LogoutApplicationService } from "./application/LogoutApplicationService.js";
import { RefreshSessionApplicationService } from "./application/RefreshSessionApplicationService.js";
import { createAuthMiddleware } from "./http/authMiddleware.js";
import { InMemoryRoleAssignmentRepository } from "./persistence/InMemoryRoleAssignmentRepository.js";
import { InMemorySellerProfileRepository } from "./persistence/InMemorySellerProfileRepository.js";
import { InMemorySessionRepository } from "./persistence/InMemorySessionRepository.js";
import { InMemoryUserRepository } from "./persistence/InMemoryUserRepository.js";
import { HmacJwtAdapter } from "./persistence/HmacJwtAdapter.js";
import { ScryptPasswordHasher } from "./persistence/ScryptPasswordHasher.js";

/**
 * In-memory Identity stack (Sprint 4.3) — domain + JWT.
 * User → SellerProfile (bridge) → Marketplace Seller.
 */
export function createInMemoryIdentityStack(opts?: { jwtSecret?: string }) {
  const users = new InMemoryUserRepository();
  const profiles = new InMemorySellerProfileRepository();
  const sessions = new InMemorySessionRepository();
  const roles = new InMemoryRoleAssignmentRepository();
  const hasher = new ScryptPasswordHasher();
  const jwt = new HmacJwtAdapter(opts?.jwtSecret ?? "test-jwt-secret-key!!");
  const tx = new InMemoryTransactionManager([users, profiles, sessions, roles]);
  const apps = createIdentityApplicationServices({ tx, users, profiles, roles, hasher });

  const login = new LoginApplicationService(tx, users, sessions, roles, hasher, jwt);
  const refresh = new RefreshSessionApplicationService(tx, users, sessions, roles, jwt);
  const logout = new LogoutApplicationService(tx, sessions, jwt);
  const auth = createAuthMiddleware({ jwt, tx, sessions, roles });

  return {
    tx,
    users,
    profiles,
    sessions,
    roles,
    hasher,
    jwt,
    ...apps,
    login,
    refresh,
    logout,
    auth,
  };
}
