import type { Pool, PoolClient } from "pg";
import { appendDomainEvent } from "../platform/events/DomainEventStore.js";
import { eventBus } from "../platform/event-bus/EventBus.js";
import { createDomainEvent } from "../shared/events/types.js";
import { getIdGenerator } from "../shared/ids/IdGenerator.js";
import type { AssetLinkInput, AssetRecord, IngestAssetInput, IngestAssetResult } from "./domain/types.js";
import { assetMediaPipeline } from "./media/AssetMediaPipeline.js";

type Q = Pool | PoolClient;

export class PostgresAssetRepository {
  constructor(private readonly db: Q) {}

  async findBySha256(sha256: string): Promise<AssetRecord | null> {
    const res = await this.db.query<{
      id: string;
      sha256: string;
      storage_key: string | null;
      width: number | null;
      height: number | null;
      mime: string | null;
      size_bytes: string | null;
      blurhash: string | null;
      cdn_url: string | null;
      derivatives: Record<string, unknown>;
    }>(`SELECT * FROM media.assets WHERE sha256 = $1 LIMIT 1`, [sha256]);
    const row = res.rows[0];
    if (!row) return null;
    return mapRow(row);
  }

  async upsertAsset(record: Omit<AssetRecord, "id"> & { id?: string }): Promise<AssetRecord> {
    const id = record.id ?? getIdGenerator().generate();
    const res = await this.db.query<{ id: string }>(
      `
      INSERT INTO media.assets (
        id, sha256, storage_key, width, height, mime, size_bytes, blurhash, cdn_url, derivatives
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb)
      ON CONFLICT (sha256) DO UPDATE SET
        storage_key = COALESCE(EXCLUDED.storage_key, media.assets.storage_key),
        cdn_url = COALESCE(EXCLUDED.cdn_url, media.assets.cdn_url),
        width = COALESCE(EXCLUDED.width, media.assets.width),
        height = COALESCE(EXCLUDED.height, media.assets.height),
        mime = COALESCE(EXCLUDED.mime, media.assets.mime),
        size_bytes = COALESCE(EXCLUDED.size_bytes, media.assets.size_bytes),
        blurhash = COALESCE(EXCLUDED.blurhash, media.assets.blurhash),
        -- Substitui em vez de mesclar (ADR-017): merge preservava derivadas antigas
        -- que apontam para objetos inexistentes e respondem 403.
        derivatives = EXCLUDED.derivatives
      RETURNING id
      `,
      [
        id,
        record.sha256,
        record.storageKey ?? null,
        record.width ?? null,
        record.height ?? null,
        record.mime ?? null,
        record.sizeBytes ?? null,
        record.blurhash ?? null,
        record.cdnUrl ?? null,
        JSON.stringify(record.derivatives ?? {}),
      ],
    );
    const assetId = res.rows[0]?.id ?? id;
    const loaded = await this.db.query(`SELECT * FROM media.assets WHERE id = $1`, [assetId]);
    return mapRow(loaded.rows[0]);
  }

  async linkAsset(input: AssetLinkInput): Promise<boolean> {
    const res = await this.db.query(
      `
      INSERT INTO media.asset_links (asset_id, entity_type, entity_id, role, sort_order)
      VALUES ($1,$2,$3,$4,$5)
      ON CONFLICT DO NOTHING
      RETURNING id
      `,
      [
        input.assetId,
        input.entityType,
        input.entityId,
        input.role ?? "primary",
        input.sortOrder ?? 0,
      ],
    );
    return (res.rowCount ?? 0) > 0;
  }

  async listForEntity(entityType: string, entityId: string): Promise<(AssetRecord & { role: string; sortOrder: number })[]> {
    const res = await this.db.query(
      `
      SELECT a.*, l.role, l.sort_order
      FROM media.asset_links l
      JOIN media.assets a ON a.id = l.asset_id
      WHERE l.entity_type = $1 AND l.entity_id = $2
      ORDER BY l.sort_order ASC
      `,
      [entityType, entityId],
    );
    return res.rows.map((row) => ({
      ...mapRow(row),
      role: String(row.role),
      sortOrder: Number(row.sort_order),
    }));
  }

  async primaryUrl(entityType: string, entityId: string): Promise<string | null> {
    const res = await this.db.query<{ cdn_url: string | null }>(
      `
      SELECT a.cdn_url
      FROM media.asset_links l
      JOIN media.assets a ON a.id = l.asset_id
      WHERE l.entity_type = $1 AND l.entity_id = $2
      ORDER BY CASE l.role WHEN 'front' THEN 0 WHEN 'primary' THEN 0 ELSE 1 END, l.sort_order
      LIMIT 1
      `,
      [entityType, entityId],
    );
    return res.rows[0]?.cdn_url ?? null;
  }
}

function mapRow(row: Record<string, unknown>): AssetRecord {
  const derivatives = (row.derivatives as Record<string, unknown>) ?? {};
  const metaFromDeriv =
    derivatives._meta && typeof derivatives._meta === "object"
      ? (derivatives._meta as AssetRecord["metadata"])
      : null;
  return {
    id: String(row.id),
    sha256: String(row.sha256),
    storageKey: row.storage_key as string | null,
    width: row.width as number | null,
    height: row.height as number | null,
    mime: row.mime as string | null,
    sizeBytes: row.size_bytes != null ? Number(row.size_bytes) : null,
    blurhash: row.blurhash as string | null,
    cdnUrl: row.cdn_url as string | null,
    derivatives,
    metadata: metaFromDeriv,
  };
}

/** Facade — ingestão deduplicada por SHA256 + vínculo polimórfico. */
export class AssetService {
  constructor(
    private readonly repo: PostgresAssetRepository,
    private readonly db: Q,
  ) {}

  async ingest(input: IngestAssetInput): Promise<IngestAssetResult> {
    const processed = await assetMediaPipeline.process({
      sourceUrl: input.sourceUrl,
      requestId: input.requestId,
      providerId: input.providerId,
      mediaType: input.mediaType,
      metadata: input.metadata,
    });

    const existing = await this.repo.findBySha256(processed.sha256);
    const asset = await this.repo.upsertAsset({
      id: existing?.id,
      sha256: processed.sha256,
      storageKey: processed.storageKey,
      width: processed.width,
      height: processed.height,
      mime: processed.mime,
      sizeBytes: processed.sizeBytes,
      blurhash: processed.blurhash,
      cdnUrl: processed.cdnUrl,
      derivatives: processed.derivatives,
      metadata: processed.metadata,
    });

    const linkCreated = await this.repo.linkAsset({
      assetId: asset.id,
      entityType: input.entityType,
      entityId: input.entityId,
      role: input.role,
      sortOrder: input.sortOrder,
    });

    const reused = Boolean(existing);
    if (!reused) {
      await appendDomainEvent(this.db, {
        eventType: "AssetCreated",
        aggregateType: "asset",
        aggregateId: asset.id,
        payload: {
          sha256: asset.sha256,
          entityType: input.entityType,
          entityId: input.entityId,
          role: input.role ?? "primary",
          mediaType: input.mediaType ?? null,
          providerId: input.providerId ?? null,
          cdnUrl: asset.cdnUrl ?? null,
        },
        metadata: { requestId: input.requestId, correlationId: input.requestId },
      });
    } else if (linkCreated) {
      await eventBus.publish(
        createDomainEvent(
          "MediaUpdated",
          input.entityId,
          {
            ownerType: input.entityType,
            reused: true,
            sha256: asset.sha256,
            assetId: asset.id,
            role: input.role ?? "primary",
          },
          {
            requestId: input.requestId,
            aggregateType: "media_asset",
            correlationId: input.requestId,
            producer: "assets",
          },
        ),
      );
    }

    return { asset, reused, linkCreated };
  }

  listForEntity(entityType: string, entityId: string) {
    return this.repo.listForEntity(entityType, entityId);
  }

  primaryUrl(entityType: string, entityId: string) {
    return this.repo.primaryUrl(entityType, entityId);
  }
}

export function createAssetService(db: Pool | PoolClient): AssetService {
  return new AssetService(new PostgresAssetRepository(db), db);
}
