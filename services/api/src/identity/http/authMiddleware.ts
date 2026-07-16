import type { IncomingMessage } from "node:http";
import type { JwtVerifier } from "../domain/Jwt.js";
import { JwtError } from "../domain/Jwt.js";
import type { TransactionManager } from "../../platform/transaction/types.js";
import type { SessionRepository } from "../domain/SessionRepository.js";
import type { RoleAssignmentRepository } from "../domain/RoleAssignmentRepository.js";
import { isSessionActive, type Permission } from "../domain/models.js";
import type { CurrentUser } from "./CurrentUser.js";
import { currentUserHas } from "./CurrentUser.js";

export class AuthError extends Error {
  constructor(
    message: string,
    readonly status: 401 | 403,
    readonly code: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export interface AuthMiddleware {
  requireAuth(req: IncomingMessage): Promise<CurrentUser>;
  requirePermission(req: IncomingMessage, permission: Permission): Promise<CurrentUser>;
  /** Buyer role required (admin also allowed). Seller alone is not enough. */
  requireBuyer(req: IncomingMessage): Promise<CurrentUser>;
}

/**
 * JWT proves identity + session. Roles always come from RoleAssignmentRepository
 * (so onboarding / role changes take effect without forcing re-login).
 */
export function createAuthMiddleware(deps: {
  jwt: JwtVerifier;
  tx: TransactionManager;
  sessions: SessionRepository;
  roles: RoleAssignmentRepository;
}): AuthMiddleware {
  async function requireAuth(req: IncomingMessage): Promise<CurrentUser> {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new AuthError("missing_bearer", 401, "unauthorized");
    }
    const token = header.slice("Bearer ".length).trim();
    let claims;
    try {
      claims = deps.jwt.verify(token);
    } catch (err) {
      if (err instanceof JwtError) {
        throw new AuthError(err.code, 401, err.code);
      }
      throw err;
    }
    if (claims.typ !== "access") {
      throw new AuthError("wrong_type", 401, "wrong_type");
    }

    const session = await deps.tx.runInTransaction((t) =>
      deps.sessions.findById(t, claims.sid),
    );
    if (!session || !isSessionActive(session, new Date())) {
      throw new AuthError("session_revoked", 401, "session_revoked");
    }
    if (session.userId !== claims.sub) {
      throw new AuthError("invalid_token", 401, "invalid_token");
    }

    const roles = await deps.tx.runInTransaction((t) =>
      deps.roles.listRoles(t, claims.sub),
    );

    return {
      userId: claims.sub,
      sessionId: claims.sid,
      roles,
    };
  }

  return {
    requireAuth,
    async requirePermission(req, permission) {
      const user = await requireAuth(req);
      if (!currentUserHas(user, permission)) {
        throw new AuthError("forbidden", 403, "forbidden");
      }
      return user;
    },
    async requireBuyer(req) {
      const user = await requireAuth(req);
      if (!user.roles.includes("buyer") && !user.roles.includes("admin")) {
        throw new AuthError("buyer_required", 403, "buyer_required");
      }
      return user;
    },
  };
}
