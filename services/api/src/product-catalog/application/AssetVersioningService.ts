import type { Pool, PoolClient } from "pg";
import { getIdGenerator } from "../../shared/ids/IdGenerator.js";
import type {
  AppendAssetVersionInput,
  AssetVersionDiff,
  AssetVersionRecord,
} from "../domain/assetVersions.js";
import { createLogger } from "../../platform/logging/logger.js";

const log = createLogger("product-catalog.asset-versions");
type Q = Pool | PoolClient;

function isPool(db: Q): db is Pool {
  return typeof (db as Pool).connect === "function";
}

function mapRow(row: Record<string, unknown>): AssetVersionRecord {
  return {
    id: String(row.id),
    assetId: String(row.asset_id),
    entityType: String(row.entity_type),
    entityId: String(row.entity_id),
    versionNumber: Number(row.version_number),
    source: String(row.source),
    sourceTrust: Number(row.source_trust),
    qualityScore: Number(row.quality_score),
    sha256: String(row.sha256),
    width: row.width != null ? Number(row.width) : null,
    height: row.height != null ? Number(row.height) : null,
    format: row.format as string | null,
    sizeBytes: row.size_bytes != null ? Number(row.size_bytes) : null,
    cdnUrl: row.cdn_url as string | null,
    pipelineVersion: String(row.pipeline_version ?? "v2"),
    derivatives: (row.derivatives as Record<string, unknown>) ?? {},
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdBy: row.created_by as string | null,
    createdAt: new Date(String(row.created_at)).toISOString(),
    isCurrent: Boolean(row.is_current),
  };
}

function isUniqueViolation(err: unknown): boolean {
  return Boolean(err && typeof err === "object" && (err as { code?: string }).code === "23505");
}

/**
 * Versioning ops: append (never delete), history, compare, rollback/restore markers.
 * Concurrent appends on the same asset_id are serialized via pg_advisory_xact_lock.
 */
export class AssetVersioningService {
  constructor(private readonly db: Q) {}

  private async withClient<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    if (isPool(this.db)) {
      const client = await this.db.connect();
      try {
        return await fn(client);
      } finally {
        client.release();
      }
    }
    return fn(this.db);
  }

  async append(input: AppendAssetVersionInput): Promise<AssetVersionRecord> {
    const maxAttempts = 5;
    let lastErr: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        return await this.withClient((client) => this.appendLocked(client, input));
      } catch (err) {
        lastErr = err;
        if (!isUniqueViolation(err) || attempt === maxAttempts) throw err;
        log.warn(
          { assetId: input.assetId, attempt, err: String(err) },
          "asset_version_append_retry",
        );
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
  }

  private async appendLocked(
    client: PoolClient,
    input: AppendAssetVersionInput,
  ): Promise<AssetVersionRecord> {
    await client.query("BEGIN");
    try {
      await client.query(`SELECT pg_advisory_xact_lock(hashtext($1::text))`, [input.assetId]);

      const next = await client.query<{ n: string }>(
        `SELECT coalesce(max(version_number), 0) + 1 AS n
         FROM product_catalog.asset_version_history WHERE asset_id = $1`,
        [input.assetId],
      );
      const versionNumber = Number(next.rows[0]?.n ?? 1);

      await client.query(
        `UPDATE product_catalog.asset_version_history SET is_current = false WHERE asset_id = $1`,
        [input.assetId],
      );

      const id = getIdGenerator().generate();
      const res = await client.query(
        `
        INSERT INTO product_catalog.asset_version_history (
          id, asset_id, entity_type, entity_id, version_number, source, source_trust,
          quality_score, sha256, width, height, format, size_bytes, cdn_url,
          pipeline_version, derivatives, metadata, created_by, is_current
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16::jsonb,$17::jsonb,$18,true
        ) RETURNING *
        `,
        [
          id,
          input.assetId,
          input.entityType,
          input.entityId,
          versionNumber,
          input.source,
          input.sourceTrust,
          input.qualityScore,
          input.sha256,
          input.width ?? null,
          input.height ?? null,
          input.format ?? null,
          input.sizeBytes ?? null,
          input.cdnUrl ?? null,
          input.pipelineVersion ?? "v2",
          JSON.stringify(input.derivatives ?? {}),
          JSON.stringify(input.metadata ?? {}),
          input.createdBy ?? null,
        ],
      );

      await client.query("COMMIT");
      log.info({ assetId: input.assetId, versionNumber }, "asset_version_appended");
      return mapRow(res.rows[0] as Record<string, unknown>);
    } catch (err) {
      try {
        await client.query("ROLLBACK");
      } catch {
        /* ignore */
      }
      throw err;
    }
  }

  async history(assetId: string): Promise<AssetVersionRecord[]> {
    const res = await this.db.query(
      `SELECT * FROM product_catalog.asset_version_history
       WHERE asset_id = $1 ORDER BY version_number DESC`,
      [assetId],
    );
    return res.rows.map(mapRow);
  }

  async getVersion(assetId: string, versionNumber: number): Promise<AssetVersionRecord | null> {
    const res = await this.db.query(
      `SELECT * FROM product_catalog.asset_version_history
       WHERE asset_id = $1 AND version_number = $2 LIMIT 1`,
      [assetId, versionNumber],
    );
    return res.rows[0] ? mapRow(res.rows[0]) : null;
  }

  async compare(assetId: string, fromVersion: number, toVersion: number): Promise<AssetVersionDiff> {
    const from = await this.getVersion(assetId, fromVersion);
    const to = await this.getVersion(assetId, toVersion);
    if (!from || !to) throw new Error("asset_version_not_found");
    const keys: (keyof AssetVersionRecord)[] = [
      "source",
      "sourceTrust",
      "qualityScore",
      "sha256",
      "width",
      "height",
      "format",
      "sizeBytes",
      "cdnUrl",
      "pipelineVersion",
    ];
    const changed = keys.filter((k) => JSON.stringify(from[k]) !== JSON.stringify(to[k]));
    return { fromVersion, toVersion, changed, from, to };
  }

  async restore(assetId: string, versionNumber: number): Promise<AssetVersionRecord> {
    const target = await this.getVersion(assetId, versionNumber);
    if (!target) throw new Error("asset_version_not_found");
    return this.append({
      assetId,
      entityType: target.entityType,
      entityId: target.entityId,
      source: target.source,
      sourceTrust: target.sourceTrust,
      qualityScore: target.qualityScore,
      sha256: target.sha256,
      width: target.width,
      height: target.height,
      format: target.format,
      sizeBytes: target.sizeBytes,
      cdnUrl: target.cdnUrl,
      pipelineVersion: target.pipelineVersion,
      derivatives: target.derivatives,
      metadata: { ...target.metadata, restoredFromVersion: versionNumber },
      createdBy: "rollback",
    });
  }

  async reprocess(assetId: string, note?: string): Promise<AssetVersionRecord | null> {
    const hist = await this.history(assetId);
    const current = hist.find((h) => h.isCurrent) ?? hist[0];
    if (!current) return null;
    return this.append({
      ...current,
      pipelineVersion: `${current.pipelineVersion}+reprocess`,
      metadata: { ...current.metadata, reprocessNote: note ?? "reprocess" },
      createdBy: "reprocess",
    });
  }
}

export function createAssetVersioningService(db: Pool | PoolClient): AssetVersioningService {
  return new AssetVersioningService(db);
}
