import { requirePostgresClient } from "../../platform/transaction/types.js";
import type { TxContext } from "../../platform/transaction/types.js";
import { getClock } from "../../shared/time/Clock.js";
import { getIdGenerator } from "../../shared/ids/IdGenerator.js";
import type { SessionRepository } from "../domain/SessionRepository.js";
import type { CreateSessionInput, Session } from "../domain/models.js";

export class PostgresSessionRepository implements SessionRepository {
  async create(tx: TxContext, input: CreateSessionInput): Promise<Session> {
    const client = requirePostgresClient(tx);
    const now = getClock().now();
    const id = input.id ?? getIdGenerator().generate();
    const expiresAt = new Date(now.getTime() + input.ttlMs);
    const res = await client.query(
      `
      INSERT INTO identity.sessions (id, user_id, created_at, expires_at)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [id, input.userId, now.toISOString(), expiresAt.toISOString()],
    );
    return mapSession(res.rows[0]);
  }

  async findById(tx: TxContext, id: string): Promise<Session | null> {
    const client = requirePostgresClient(tx);
    const res = await client.query(`SELECT * FROM identity.sessions WHERE id = $1`, [id]);
    return res.rows[0] ? mapSession(res.rows[0]) : null;
  }

  async revoke(tx: TxContext, id: string): Promise<void> {
    const client = requirePostgresClient(tx);
    await client.query(
      `UPDATE identity.sessions SET revoked_at = now() WHERE id = $1 AND revoked_at IS NULL`,
      [id],
    );
  }

  async listByUser(tx: TxContext, userId: string): Promise<Session[]> {
    const client = requirePostgresClient(tx);
    const res = await client.query(
      `SELECT * FROM identity.sessions WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId],
    );
    return res.rows.map(mapSession);
  }
}

function mapSession(row: Record<string, unknown>): Session {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    createdAt: new Date(String(row.created_at)),
    expiresAt: new Date(String(row.expires_at)),
    revokedAt: row.revoked_at != null ? new Date(String(row.revoked_at)) : null,
  };
}
