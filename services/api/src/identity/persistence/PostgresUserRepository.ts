import { requirePostgresClient } from "../../platform/transaction/types.js";
import type { TxContext } from "../../platform/transaction/types.js";
import { getIdGenerator } from "../../shared/ids/IdGenerator.js";
import type { RepositoryResult } from "../../shared/persistence/RepositoryResult.js";
import type { UserRepository } from "../domain/UserRepository.js";
import { normalizeEmail, type User, type UserUpsert } from "../domain/models.js";

export class PostgresUserRepository implements UserRepository {
  async upsert(tx: TxContext, input: UserUpsert): Promise<RepositoryResult<User>> {
    const client = requirePostgresClient(tx);
    const email = normalizeEmail(input.email);
    const existing =
      (input.id != null ? await this.findById(tx, input.id) : null) ??
      (await this.findByEmail(tx, email));

    if (existing && input.expectedVersion != null && existing.rowVersion !== input.expectedVersion) {
      throw new Error(`optimistic_lock_failed:user:${existing.id}`);
    }

    const next = {
      email,
      displayName: input.displayName,
      emailVerified: input.emailVerified ?? existing?.emailVerified ?? false,
      passwordHash:
        input.passwordHash !== undefined ? input.passwordHash : existing?.passwordHash ?? null,
      status: input.status ?? existing?.status ?? "active",
    };

    if (
      existing &&
      existing.displayName === next.displayName &&
      existing.emailVerified === next.emailVerified &&
      (existing.passwordHash ?? null) === (next.passwordHash ?? null) &&
      existing.status === next.status
    ) {
      return {
        outcome: "unchanged",
        entity: existing,
        previousVersion: existing.rowVersion,
        currentVersion: existing.rowVersion,
      };
    }

    const id = existing?.id ?? input.id ?? getIdGenerator().generate();
    const res = await client.query(
      `
      INSERT INTO identity.users
        (id, email, display_name, email_verified, password_hash, status, row_version)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (email) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        email_verified = EXCLUDED.email_verified,
        password_hash = EXCLUDED.password_hash,
        status = EXCLUDED.status,
        row_version = identity.users.row_version + 1,
        updated_at = now()
      RETURNING *
      `,
      [
        id,
        next.email,
        next.displayName,
        next.emailVerified,
        next.passwordHash,
        next.status,
        existing ? existing.rowVersion + 1 : 1,
      ],
    );
    const entity = mapUser(res.rows[0]);
    return {
      outcome: existing ? "updated" : "created",
      entity,
      previousVersion: existing?.rowVersion ?? null,
      currentVersion: entity.rowVersion,
    };
  }

  async findById(tx: TxContext, id: string): Promise<User | null> {
    const client = requirePostgresClient(tx);
    const res = await client.query(`SELECT * FROM identity.users WHERE id = $1`, [id]);
    return res.rows[0] ? mapUser(res.rows[0]) : null;
  }

  async findByEmail(tx: TxContext, email: string): Promise<User | null> {
    const client = requirePostgresClient(tx);
    const res = await client.query(`SELECT * FROM identity.users WHERE email = $1`, [
      normalizeEmail(email),
    ]);
    return res.rows[0] ? mapUser(res.rows[0]) : null;
  }
}

function mapUser(row: Record<string, unknown>): User {
  return {
    id: String(row.id),
    email: String(row.email),
    displayName: String(row.display_name),
    emailVerified: Boolean(row.email_verified),
    passwordHash: row.password_hash != null ? String(row.password_hash) : null,
    status: row.status as User["status"],
    rowVersion: Number(row.row_version ?? 1),
    createdAt: new Date(String(row.created_at)),
    updatedAt: new Date(String(row.updated_at)),
  };
}
