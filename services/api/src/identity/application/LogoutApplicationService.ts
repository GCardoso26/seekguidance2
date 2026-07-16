import type { TransactionManager } from "../../platform/transaction/types.js";
import type { SessionRepository } from "../domain/SessionRepository.js";
import type { JwtVerifier } from "../domain/Jwt.js";
import { JwtError } from "../domain/Jwt.js";

/**
 * Logout — revoke Session (Access + Refresh become invalid on next check).
 * Accepts either access or refresh token; extracts sid.
 */
export class LogoutApplicationService {
  constructor(
    private readonly tx: TransactionManager,
    private readonly sessions: SessionRepository,
    private readonly jwt: JwtVerifier,
  ) {}

  async execute(token: string): Promise<void> {
    let claims;
    try {
      claims = this.jwt.verify(token);
    } catch (err) {
      // Already expired / invalid — treat as success (idempotent logout).
      if (err instanceof JwtError) return;
      throw err;
    }
    await this.tx.runInTransaction((t) => this.sessions.revoke(t, claims.sid));
  }
}
