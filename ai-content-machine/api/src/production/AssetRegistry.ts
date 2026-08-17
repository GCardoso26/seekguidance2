import { createHash } from 'node:crypto'
import fs from 'node:fs'
import { getDb, uid, nowIso } from '../db/client.js'
import type { AssetType, SourceType } from './types.js'

export type RegisterAssetInput = {
  workspaceId: string
  contentId?: string | null
  productionId: string
  type: AssetType
  sourceType: SourceType
  provider: string
  uri: string
  mimeType?: string
  fileSize?: number
  duration?: number | null
  width?: number | null
  height?: number | null
  checksum?: string
  license?: string
  metadata?: Record<string, unknown>
  parentAssetId?: string | null
  version?: number
  stage?: string
  assetKey: string
  reality?: string
}

export class AssetRegistry {
  computeChecksum(filePath: string): string {
    const buf = fs.readFileSync(filePath)
    return createHash('sha256').update(buf).digest('hex')
  }

  nextVersion(productionId: string, assetKey: string): number {
    const row = getDb()
      .prepare(
        `SELECT COALESCE(MAX(version), 0) as v FROM media_assets WHERE production_id = ? AND asset_key = ?`,
      )
      .get(productionId, assetKey) as { v: number }
    return Number(row.v) + 1
  }

  markPreviousNotCurrent(productionId: string, assetKey: string): void {
    getDb()
      .prepare(`UPDATE media_assets SET is_current = 0 WHERE production_id = ? AND asset_key = ?`)
      .run(productionId, assetKey)
  }

  register(input: RegisterAssetInput): { id: string; version: number; checksum: string } {
    if (input.sourceType === ('UNKNOWN' as SourceType)) {
      throw new Error('source_type_unknown_forbidden')
    }
    const db = getDb()
    const version = input.version ?? this.nextVersion(input.productionId, input.assetKey)
    this.markPreviousNotCurrent(input.productionId, input.assetKey)

    let checksum = input.checksum
    let fileSize = input.fileSize ?? 0
    if ((!checksum || !fileSize) && fs.existsSync(input.uri)) {
      const st = fs.statSync(input.uri)
      fileSize = fileSize || st.size
      checksum = checksum || this.computeChecksum(input.uri)
    }
    if (!checksum) throw new Error('checksum_required')

    const id = uid()
    db.prepare(
      `INSERT INTO media_assets
       (id, workspace_id, content_id, production_id, type, source_type, provider, uri,
        mime_type, file_size, duration, width, height, checksum, license, metadata,
        parent_asset_id, version, is_current, stage, asset_key, reality, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)`,
    ).run(
      id,
      input.workspaceId,
      input.contentId ?? null,
      input.productionId,
      input.type,
      input.sourceType,
      input.provider,
      input.uri,
      input.mimeType ?? null,
      fileSize,
      input.duration ?? null,
      input.width ?? null,
      input.height ?? null,
      checksum,
      input.license ?? (input.sourceType === 'MOCK' ? 'MOCK' : 'UNKNOWN'),
      JSON.stringify(input.metadata ?? {}),
      input.parentAssetId ?? null,
      version,
      input.stage ?? null,
      input.assetKey,
      input.reality ?? 'MOCK',
      nowIso(),
    )
    return { id, version, checksum }
  }

  getCurrent(productionId: string, assetKey: string) {
    return getDb()
      .prepare(
        `SELECT * FROM media_assets WHERE production_id = ? AND asset_key = ? AND is_current = 1`,
      )
      .get(productionId, assetKey)
  }

  listByProduction(productionId: string) {
    return getDb()
      .prepare(`SELECT * FROM media_assets WHERE production_id = ? ORDER BY created_at ASC`)
      .all(productionId)
  }

  listByContent(contentId: string) {
    return getDb()
      .prepare(`SELECT * FROM media_assets WHERE content_id = ? ORDER BY created_at DESC`)
      .all(contentId)
  }

  listCurrentByType(productionId: string, type: AssetType) {
    return getDb()
      .prepare(
        `SELECT * FROM media_assets WHERE production_id = ? AND type = ? AND is_current = 1`,
      )
      .all(productionId, type)
  }

  findByChecksum(workspaceId: string, checksum: string) {
    return getDb()
      .prepare(
        `SELECT * FROM media_assets WHERE workspace_id = ? AND checksum = ? ORDER BY created_at DESC LIMIT 1`,
      )
      .get(workspaceId, checksum)
  }
}

export const assetRegistry = new AssetRegistry()
