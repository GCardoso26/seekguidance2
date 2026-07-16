import type { TransactionManager } from "../../platform/transaction/types.js";
import type { PasswordHasher } from "../domain/PasswordHasher.js";
import type { RoleAssignmentRepository } from "../domain/RoleAssignmentRepository.js";
import type { SessionRepository } from "../domain/SessionRepository.js";
import type { UserRepository } from "../domain/UserRepository.js";
import type { JwtSigner } from "../domain/Jwt.js";
import type { RoleName } from "../domain/models.js";
import { normalizeEmail } from "../domain/models.js";

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  userId: string;
  roles: RoleName[];
  sessionId: string;
}

export interface TokenTtl {
  accessTtlSec: number;
  refreshTtlSec: number;
}

const DEFAULT_TTL: TokenTtl = {
  accessTtlSec: 15 * 60,
  refreshTtlSec: 7 * 24 * 60 * 60,
};

/**
 * Login — verify password, create Session, issue Access + Refresh JWT.
 * Session is the revocation source of truth (logout / refresh rotation).
 */
export class LoginApplicationService {
  constructor(
    private readonly tx: TransactionManager,
    private readonly users: UserRepository,
    private readonly sessions: SessionRepository,
    private readonly roles: RoleAssignmentRepository,
    private readonly hasher: PasswordHasher,
    private readonly jwt: JwtSigner,
    private readonly ttl: TokenTtl = DEFAULT_TTL,
  ) {}

  async execute(input: LoginInput): Promise<AuthTokens> {
    const user = await this.tx.runInTransaction((t) =>
      this.users.findByEmail(t, normalizeEmail(input.email)),
    );
    if (!user || user.status !== "active" || !user.passwordHash) {
      throw new Error("invalid_credentials");
    }
    const ok = await this.hasher.verify(input.password, user.passwordHash);
    if (!ok) throw new Error("invalid_credentials");

    const roles = await this.tx.runInTransaction((t) => this.roles.listRoles(t, user.id));
    const session = await this.tx.runInTransaction((t) =>
      this.sessions.create(t, {
        userId: user.id,
        ttlMs: this.ttl.refreshTtlSec * 1000,
      }),
    );

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
