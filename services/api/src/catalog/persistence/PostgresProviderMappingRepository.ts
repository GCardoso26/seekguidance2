import { requirePostgresClient } from "../../platform/transaction/types.js";
import type { TxContext } from "../../platform/transaction/types.js";
import { getIdGenerator } from "../../shared/ids/IdGenerator.js";
import type { RepositoryResult } from "../../shared/persistence/RepositoryResult.js";
import type { ProviderMappingRepository } from "../domain/ProviderMappingRepository.js";
import type {
  ProviderMapping,
  ProviderMappingUpsert,
  ProviderObjectType,
} from "../domain/models.js";

export class PostgresProviderMappingRepository implements ProviderMappingRepository {
  async upsert(
    tx: TxContext,
    input: ProviderMappingUpsert,
  ): Promise<RepositoryResult<ProviderMapping>> {
    const client = requirePostgresClient(tx);
    const existing = await this.findByProviderObject(tx, input.provider, input.providerObjectType, {
      providerCardId: input.providerCardId,
      providerSetId: input.providerSetId,
      providerVariantId: input.providerVariantId,
    }) ?? (input.providerObjectType === "CARD" && input.providerCardId
      ? await this.findByProviderCardId(tx, input.provider, input.providerCardId)
      : null);

    if (existing && input.expectedVersion != null && existing.rowVersion !== input.expectedVersion) {
      throw new Error(`optimistic_lock_failed:mapping:${existing.id}`);
    }

    const nextMeta = input.metadata ?? {};
    if (
      existing &&
      (existing.catalogCardId ?? null) === (input.catalogCardId ?? null) &&
      (existing.catalogSetId ?? null) === (input.catalogSetId ?? null) &&
      (existing.catalogVariantId ?? null) === (input.catalogVariantId ?? null) &&
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
      INSERT INTO catalog.provider_mappings (
        id, provider, provider_object_type,
        provider_card_id, provider_set_id, provider_variant_id,
        catalog_card_id, catalog_set_id, catalog_variant_id, metadata, row_version
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11)
      ON CONFLICT (id) DO UPDATE SET
        provider = EXCLUDED.provider,
        provider_object_type = EXCLUDED.provider_object_type,
        provider_card_id = EXCLUDED.provider_card_id,
        provider_set_id = EXCLUDED.provider_set_id,
        provider_variant_id = EXCLUDED.provider_variant_id,
        catalog_card_id = EXCLUDED.catalog_card_id,
        catalog_set_id = EXCLUDED.catalog_set_id,
        catalog_variant_id = EXCLUDED.catalog_variant_id,
        metadata = EXCLUDED.metadata,
        row_version = catalog.provider_mappings.row_version + 1,
        updated_at = now()
      RETURNING *
      `,
      [
        id,
        input.provider,
        input.providerObjectType,
        input.providerCardId ?? null,
        input.providerSetId ?? null,
        input.providerVariantId ?? null,
        input.catalogCardId ?? null,
        input.catalogSetId ?? null,
        input.catalogVariantId ?? null,
        JSON.stringify(nextMeta),
        existing ? existing.rowVersion + 1 : 1,
      ],
    );
    const entity = mapMapping(res.rows[0]);
    return {
      outcome: existing ? "updated" : "created",
      entity,
      previousVersion: existing?.rowVersion ?? null,
      currentVersion: entity.rowVersion,
    };
  }

  async findById(tx: TxContext, id: string): Promise<ProviderMapping | null> {
    const client = requirePostgresClient(tx);
    const res = await client.query(`SELECT * FROM catalog.provider_mappings WHERE id = $1`, [id]);
    return res.rows[0] ? mapMapping(res.rows[0]) : null;
  }

  async findByProviderObject(
    tx: TxContext,
    provider: string,
    providerObjectType: ProviderObjectType,
    keys: {
      providerCardId?: string | null;
      providerSetId?: string | null;
      providerVariantId?: string | null;
    },
  ): Promise<ProviderMapping | null> {
    const client = requirePostgresClient(tx);
    const res = await client.query(
      `
      SELECT * FROM catalog.provider_mappings
      WHERE provider = $1
        AND provider_object_type = $2
        AND COALESCE(provider_card_id, '') = COALESCE($3, '')
        AND COALESCE(provider_set_id, '') = COALESCE($4, '')
        AND COALESCE(provider_variant_id, '') = COALESCE($5, '')
      LIMIT 1
      `,
      [
        provider,
        providerObjectType,
        keys.providerCardId ?? null,
        keys.providerSetId ?? null,
        keys.providerVariantId ?? null,
      ],
    );
    return res.rows[0] ? mapMapping(res.rows[0]) : null;
  }

  async findByProviderCardId(
    tx: TxContext,
    provider: string,
    providerCardId: string,
  ): Promise<ProviderMapping | null> {
    const client = requirePostgresClient(tx);
    const res = await client.query(
      `
      SELECT * FROM catalog.provider_mappings
      WHERE provider = $1
        AND provider_object_type = 'CARD'
        AND provider_card_id = $2
      ORDER BY updated_at DESC
      LIMIT 1
      `,
      [provider, providerCardId],
    );
    return res.rows[0] ? mapMapping(res.rows[0]) : null;
  }
}

function mapMapping(row: Record<string, unknown>): ProviderMapping {
  const metadata =
    typeof row.metadata === "string"
      ? (JSON.parse(row.metadata) as Record<string, unknown>)
      : ((row.metadata as Record<string, unknown>) ?? {});
  return {
    id: String(row.id),
    provider: String(row.provider),
    providerObjectType: row.provider_object_type as ProviderObjectType,
    providerCardId: row.provider_card_id ? String(row.provider_card_id) : null,
    providerSetId: row.provider_set_id ? String(row.provider_set_id) : null,
    providerVariantId: row.provider_variant_id ? String(row.provider_variant_id) : null,
    catalogCardId: row.catalog_card_id ? String(row.catalog_card_id) : null,
    catalogSetId: row.catalog_set_id ? String(row.catalog_set_id) : null,
    catalogVariantId: row.catalog_variant_id ? String(row.catalog_variant_id) : null,
    metadata,
    rowVersion: Number(row.row_version ?? 1),
    createdAt: new Date(String(row.created_at)),
    updatedAt: new Date(String(row.updated_at)),
  };
}
