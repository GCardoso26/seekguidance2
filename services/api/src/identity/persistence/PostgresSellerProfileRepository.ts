import { requirePostgresClient } from "../../platform/transaction/types.js";
import type { TxContext } from "../../platform/transaction/types.js";
import { getIdGenerator } from "../../shared/ids/IdGenerator.js";
import type { RepositoryResult } from "../../shared/persistence/RepositoryResult.js";
import type { SellerProfileRepository } from "../domain/SellerProfileRepository.js";
import type { SellerProfile, SellerProfileUpsert } from "../domain/models.js";

export class PostgresSellerProfileRepository implements SellerProfileRepository {
  async upsert(
    tx: TxContext,
    input: SellerProfileUpsert,
  ): Promise<RepositoryResult<SellerProfile>> {
    const client = requirePostgresClient(tx);
    const existing =
      (input.id != null ? await this.findById(tx, input.id) : null) ??
      (await this.findByUserId(tx, input.userId));

    if (existing && input.expectedVersion != null && existing.rowVersion !== input.expectedVersion) {
      throw new Error(`optimistic_lock_failed:seller_profile:${existing.id}`);
    }

    if (existing && existing.userId === input.userId && existing.sellerId === input.sellerId) {
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
      INSERT INTO identity.seller_profiles (id, user_id, seller_id, row_version)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id) DO UPDATE SET
        seller_id = EXCLUDED.seller_id,
        row_version = identity.seller_profiles.row_version + 1,
        updated_at = now()
      RETURNING *
      `,
      [id, input.userId, input.sellerId, existing ? existing.rowVersion + 1 : 1],
    );
    const entity = mapProfile(res.rows[0]);
    return {
      outcome: existing ? "updated" : "created",
      entity,
      previousVersion: existing?.rowVersion ?? null,
      currentVersion: entity.rowVersion,
    };
  }

  async findById(tx: TxContext, id: string): Promise<SellerProfile | null> {
    const client = requirePostgresClient(tx);
    const res = await client.query(`SELECT * FROM identity.seller_profiles WHERE id = $1`, [id]);
    return res.rows[0] ? mapProfile(res.rows[0]) : null;
  }

  async findByUserId(tx: TxContext, userId: string): Promise<SellerProfile | null> {
    const client = requirePostgresClient(tx);
    const res = await client.query(
      `SELECT * FROM identity.seller_profiles WHERE user_id = $1`,
      [userId],
    );
    return res.rows[0] ? mapProfile(res.rows[0]) : null;
  }

  async findBySellerId(tx: TxContext, sellerId: string): Promise<SellerProfile | null> {
    const client = requirePostgresClient(tx);
    const res = await client.query(
      `SELECT * FROM identity.seller_profiles WHERE seller_id = $1`,
      [sellerId],
    );
    return res.rows[0] ? mapProfile(res.rows[0]) : null;
  }
}

function mapProfile(row: Record<string, unknown>): SellerProfile {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    sellerId: String(row.seller_id),
    rowVersion: Number(row.row_version ?? 1),
    createdAt: new Date(String(row.created_at)),
    updatedAt: new Date(String(row.updated_at)),
  };
}
