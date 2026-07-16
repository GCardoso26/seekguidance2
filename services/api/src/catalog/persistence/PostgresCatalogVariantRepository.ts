import { requirePostgresClient } from "../../platform/transaction/types.js";
import type { TxContext } from "../../platform/transaction/types.js";
import { getIdGenerator } from "../../shared/ids/IdGenerator.js";
import type { RepositoryResult } from "../../shared/persistence/RepositoryResult.js";
import type { CatalogVariantRepository } from "../domain/CatalogVariantRepository.js";
import type { CatalogVariant, CatalogVariantUpsert } from "../domain/models.js";

export class PostgresCatalogVariantRepository implements CatalogVariantRepository {
  async upsert(
    tx: TxContext,
    input: CatalogVariantUpsert,
  ): Promise<RepositoryResult<CatalogVariant>> {
    const client = requirePostgresClient(tx);
    const existing = input.id ? await this.findById(tx, input.id) : null;

    if (existing && input.expectedVersion != null && existing.rowVersion !== input.expectedVersion) {
      throw new Error(`optimistic_lock_failed:variant:${existing.id}`);
    }

    const nextMeta = input.metadata ?? {};
    if (
      existing &&
      existing.cardId === input.cardId &&
      (existing.finish ?? null) === (input.finish ?? null) &&
      (existing.language ?? null) === (input.language ?? null) &&
      existing.isFoil === (input.isFoil ?? false) &&
      (existing.label ?? null) === (input.label ?? null) &&
      JSON.stringify(existing.metadata) === JSON.stringify(nextMeta)
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
      INSERT INTO catalog.catalog_variants (
        id, card_id, finish, language, is_foil, label, metadata, row_version
      ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)
      ON CONFLICT (id) DO UPDATE SET
        card_id = EXCLUDED.card_id,
        finish = EXCLUDED.finish,
        language = EXCLUDED.language,
        is_foil = EXCLUDED.is_foil,
        label = EXCLUDED.label,
        metadata = EXCLUDED.metadata,
        row_version = catalog.catalog_variants.row_version + 1
      RETURNING *
      `,
      [
        id,
        input.cardId,
        input.finish ?? null,
        input.language ?? null,
        input.isFoil ?? false,
        input.label ?? null,
        JSON.stringify(nextMeta),
        existing ? existing.rowVersion + 1 : 1,
      ],
    );
    const entity = mapVariant(res.rows[0]);
    return {
      outcome: existing ? "updated" : "created",
      entity,
      previousVersion: existing?.rowVersion ?? null,
      currentVersion: entity.rowVersion,
    };
  }

  async findById(tx: TxContext, id: string): Promise<CatalogVariant | null> {
    const client = requirePostgresClient(tx);
    const res = await client.query(`SELECT * FROM catalog.catalog_variants WHERE id = $1`, [id]);
    return res.rows[0] ? mapVariant(res.rows[0]) : null;
  }

  async findByCardId(tx: TxContext, cardId: string): Promise<CatalogVariant[]> {
    const client = requirePostgresClient(tx);
    const res = await client.query(`SELECT * FROM catalog.catalog_variants WHERE card_id = $1`, [
      cardId,
    ]);
    return res.rows.map(mapVariant);
  }
}

function mapVariant(row: Record<string, unknown>): CatalogVariant {
  const metadata =
    typeof row.metadata === "string"
      ? (JSON.parse(row.metadata) as Record<string, unknown>)
      : ((row.metadata as Record<string, unknown>) ?? {});
  return {
    id: String(row.id),
    cardId: String(row.card_id),
    finish: row.finish ? String(row.finish) : null,
    language: row.language ? String(row.language) : null,
    isFoil: Boolean(row.is_foil),
    label: row.label ? String(row.label) : null,
    metadata,
    rowVersion: Number(row.row_version ?? 1),
    createdAt: new Date(String(row.created_at)),
  };
}
