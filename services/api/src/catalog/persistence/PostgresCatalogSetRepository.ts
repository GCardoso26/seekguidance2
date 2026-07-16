import { requirePostgresClient } from "../../platform/transaction/types.js";
import type { TxContext } from "../../platform/transaction/types.js";
import { getIdGenerator } from "../../shared/ids/IdGenerator.js";
import type { RepositoryResult } from "../../shared/persistence/RepositoryResult.js";
import type { CatalogSetRepository } from "../domain/CatalogSetRepository.js";
import type { CatalogSet, CatalogSetUpsert } from "../domain/models.js";

export class PostgresCatalogSetRepository implements CatalogSetRepository {
  async upsert(tx: TxContext, input: CatalogSetUpsert): Promise<RepositoryResult<CatalogSet>> {
    const client = requirePostgresClient(tx);
    const existing = await this.findByGameAndCode(tx, input.gameId, input.code);

    if (existing && input.expectedVersion != null && existing.rowVersion !== input.expectedVersion) {
      throw new Error(`optimistic_lock_failed:set:${existing.id}`);
    }

    if (
      existing &&
      existing.name === input.name &&
      (existing.releaseDate ?? null) === (input.releaseDate ?? null)
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
      INSERT INTO catalog.catalog_sets (id, game_id, code, name, release_date, row_version)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (game_id, code) DO UPDATE SET
        name = EXCLUDED.name,
        release_date = EXCLUDED.release_date,
        row_version = catalog.catalog_sets.row_version + 1,
        updated_at = now()
      RETURNING *
      `,
      [id, input.gameId, input.code, input.name, input.releaseDate ?? null, existing ? existing.rowVersion + 1 : 1],
    );
    const entity = mapSet(res.rows[0]);
    return {
      outcome: existing ? "updated" : "created",
      entity,
      previousVersion: existing?.rowVersion ?? null,
      currentVersion: entity.rowVersion,
    };
  }

  async findById(tx: TxContext, id: string): Promise<CatalogSet | null> {
    const client = requirePostgresClient(tx);
    const res = await client.query(`SELECT * FROM catalog.catalog_sets WHERE id = $1`, [id]);
    return res.rows[0] ? mapSet(res.rows[0]) : null;
  }

  async findByGameAndCode(
    tx: TxContext,
    gameId: string,
    code: string,
  ): Promise<CatalogSet | null> {
    const client = requirePostgresClient(tx);
    const res = await client.query(
      `SELECT * FROM catalog.catalog_sets WHERE game_id = $1 AND code = $2`,
      [gameId, code],
    );
    return res.rows[0] ? mapSet(res.rows[0]) : null;
  }
}

function mapSet(row: Record<string, unknown>): CatalogSet {
  return {
    id: String(row.id),
    gameId: String(row.game_id),
    code: String(row.code),
    name: String(row.name),
    releaseDate: formatPgDate(row.release_date),
    rowVersion: Number(row.row_version ?? 1),
    createdAt: new Date(String(row.created_at)),
    updatedAt: new Date(String(row.updated_at)),
  };
}

/** Normalize pg date / Date / ISO string → YYYY-MM-DD (or null). */
function formatPgDate(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return value.toISOString().slice(0, 10);
  }
  const s = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}
