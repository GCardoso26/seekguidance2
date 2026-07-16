import { requirePostgresClient } from "../../platform/transaction/types.js";
import type { TxContext } from "../../platform/transaction/types.js";
import { getIdGenerator } from "../../shared/ids/IdGenerator.js";
import type { RepositoryResult } from "../../shared/persistence/RepositoryResult.js";
import type { SellerRepository } from "../domain/SellerRepository.js";
import type { Seller, SellerUpsert } from "../domain/models.js";

export class PostgresSellerRepository implements SellerRepository {
  async upsert(tx: TxContext, input: SellerUpsert): Promise<RepositoryResult<Seller>> {
    const client = requirePostgresClient(tx);
    const existing =
      (input.id != null ? await this.findById(tx, input.id) : null) ??
      (await this.findBySlug(tx, input.slug));

    if (existing && input.expectedVersion != null && existing.rowVersion !== input.expectedVersion) {
      throw new Error(`optimistic_lock_failed:seller:${existing.id}`);
    }

    const next = {
      displayName: input.displayName,
      slug: input.slug,
      status: input.status ?? existing?.status ?? "pending",
      verification: input.verification ?? existing?.verification ?? "unverified",
      configuration: input.configuration ?? existing?.configuration ?? {},
    };

    if (
      existing &&
      existing.displayName === next.displayName &&
      existing.status === next.status &&
      existing.verification === next.verification &&
      JSON.stringify(existing.configuration) === JSON.stringify(next.configuration)
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
      INSERT INTO marketplace.sellers
        (id, display_name, slug, status, verification, configuration, row_version)
      VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
      ON CONFLICT (slug) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        status = EXCLUDED.status,
        verification = EXCLUDED.verification,
        configuration = EXCLUDED.configuration,
        row_version = marketplace.sellers.row_version + 1,
        updated_at = now()
      RETURNING *
      `,
      [
        id,
        next.displayName,
        next.slug,
        next.status,
        next.verification,
        JSON.stringify(next.configuration),
        existing ? existing.rowVersion + 1 : 1,
      ],
    );
    const entity = mapSeller(res.rows[0]);
    return {
      outcome: existing ? "updated" : "created",
      entity,
      previousVersion: existing?.rowVersion ?? null,
      currentVersion: entity.rowVersion,
    };
  }

  async findById(tx: TxContext, id: string): Promise<Seller | null> {
    const client = requirePostgresClient(tx);
    const res = await client.query(`SELECT * FROM marketplace.sellers WHERE id = $1`, [id]);
    return res.rows[0] ? mapSeller(res.rows[0]) : null;
  }

  async findBySlug(tx: TxContext, slug: string): Promise<Seller | null> {
    const client = requirePostgresClient(tx);
    const res = await client.query(`SELECT * FROM marketplace.sellers WHERE slug = $1`, [slug]);
    return res.rows[0] ? mapSeller(res.rows[0]) : null;
  }
}

function mapSeller(row: Record<string, unknown>): Seller {
  return {
    id: String(row.id),
    displayName: String(row.display_name),
    slug: String(row.slug),
    status: row.status as Seller["status"],
    verification: row.verification as Seller["verification"],
    configuration: (row.configuration as Record<string, unknown>) ?? {},
    rowVersion: Number(row.row_version ?? 1),
    createdAt: new Date(String(row.created_at)),
    updatedAt: new Date(String(row.updated_at)),
  };
}
