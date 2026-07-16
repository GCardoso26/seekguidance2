import type { TransactionManager } from "../../platform/transaction/types.js";
import type { RoleAssignmentRepository } from "../domain/RoleAssignmentRepository.js";
import type { SessionRepository } from "../domain/SessionRepository.js";
import type { UserRepository } from "../domain/UserRepository.js";
import type { JwtSigner, JwtVerifier } from "../domain/Jwt.js";
import { JwtError } from "../domain/Jwt.js";
import { isSessionActive } from "../domain/models.js";
import type { AuthTokens, TokenTtl } from "./LoginApplicationService.js";

const DEFAULT_TTL: TokenTtl = {
  accessTtlSec: 15 * 60,
  refreshTtlSec: 7 * 24 * 60 * 60,
};

/**
 * Refresh — verify refresh JWT, confirm Session still active, issue new Access (+ same Refresh).
 * Does not rotate session id (simple 4.3); logout revokes the session.
 */
export class RefreshSessionApplicationService {
  constructor(
    private readonly tx: TransactionManager,
    private readonly users: UserRepository,
    private readonly sessions: SessionRepository,
    private readonly roles: RoleAssignmentRepository,
    private readonly jwt: JwtSigner & JwtVerifier,
    private readonly ttl: TokenTtl = DEFAULT_TTL,
  ) {}

  async execute(refreshToken: string): Promise<AuthTokens> {
    let claims;
    try {
      claims = this.jwt.verify(refreshToken);
    } catch (err) {
      if (err instanceof JwtError) throw new Error(err.code);
      throw err;
    }
    if (claims.typ !== "refresh") throw new Error("wrong_type");

    const session = await this.tx.runInTransaction((t) => this.sessions.findById(t, claims.sid));
    if (!session || !isSessionActive(session, new Date())) {
      throw new Error("session_revoked");
    }
    if (session.userId !== claims.sub) throw new Error("invalid_token");

    const user = await this.tx.runInTransaction((t) => this.users.findById(t, claims.sub));
    if (!user || user.status !== "active") throw new Error("invalid_credentials");

    const roles = await this.tx.runInTransaction((t) => this.roles.listRoles(t, user.id));

    return {
      accessToken: this.jwt.signAccess(
        { sub: user.id, sid: session.id, roles },
        this.ttl.accessTtlSec,
      ),
      refreshToken: this.jwt.signRefresh(
        { sub: user.id, sid: session.id },
        this.ttl.refreshTtlSec,
      ),
      expiresIn: this.ttl.accessTtlSec,
      userId: user.id,
      roles,
      sessionId: session.id,
    };
  }
}
