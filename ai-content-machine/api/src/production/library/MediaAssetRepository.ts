import fs from 'node:fs'
import { getDb, uid, nowIso } from '../../db/client.js'
import { assetRegistry } from '../AssetRegistry.js'

export type LibraryAssetType = 'image' | 'audio' | 'video'
export type LibraryAssetSource = 'generated' | 'stock' | 'uploaded' | 'mock'

export type MediaLibraryAsset = {
  id: string
  workspaceId: string
  contentId: string | null
  productionId: string | null
  path: string
  sha256: string
  type: LibraryAssetType
  source: LibraryAssetSource
  tags: string[]
  usageCount: number
  metadata: Record<string, unknown>
  createdAt: string
  lastUsedAt: string | null
}

export type LibrarySearchHit = {
  asset: MediaLibraryAsset
  matchedTags: string[]
  matchScore: number
  reuseReason: 'tag_match'
}

export type CatalogInput = {
  workspaceId: string
  contentId?: string | null
  productionId?: string | null
  path: string
  type: LibraryAssetType
  source: LibraryAssetSource
  tags: string[]
  metadata?: Record<string, unknown>
  /** When omitted, checksum is computed from path if the file exists */
  sha256?: string
}

const STOP = new Set([
  'a',
  'o',
  'os',
  'as',
  'de',
  'da',
  'do',
  'das',
  'dos',
  'e',
  'em',
  'um',
  'uma',
  'para',
  'por',
  'com',
  'the',
  'and',
  'for',
  'from',
  'with',
  'scene',
  'dark',
  'content',
])

/** Exact/tag tokens from a visual prompt — no embeddings. */
export function deriveTagsFromPrompt(prompt: string): string[] {
  const raw = prompt
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9]+/g)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3 && !STOP.has(t) && !/^\d+$/.test(t))
  return [...new Set(raw)].slice(0, 24)
}

function parseTags(raw: string): string[] {
  try {
    const v = JSON.parse(raw || '[]')
    return Array.isArray(v) ? v.map(String) : []
  } catch {
    return []
  }
}

function parseMeta(raw: string): Record<string, unknown> {
  try {
    const v = JSON.parse(raw || '{}')
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

function rowToAsset(row: Record<string, unknown>): MediaLibraryAsset {
  return {
    id: String(row.id),
    workspaceId: String(row.workspace_id),
    contentId: row.content_id != null ? String(row.content_id) : null,
    productionId: row.production_id != null ? String(row.production_id) : null,
    path: String(row.path),
    sha256: String(row.sha256),
    type: String(row.type) as LibraryAssetType,
    source: String(row.source) as LibraryAssetSource,
    tags: parseTags(String(row.tags || '[]')),
    usageCount: Number(row.usage_count || 0),
    metadata: parseMeta(String(row.metadata || '{}')),
    createdAt: String(row.created_at),
    lastUsedAt: row.last_used_at != null ? String(row.last_used_at) : null,
  }
}

function scoreTagOverlap(query: string[], candidate: string[]): { matched: string[]; score: number } {
  if (!query.length) return { matched: [], score: 0 }
  const set = new Set(candidate.map((t) => t.toLowerCase()))
  const matched = query.filter((t) => set.has(t.toLowerCase()))
  return { matched, score: matched.length / query.length }
}

/**
 * Catalog / search / reuse for the Asset Library.
 * Does not own bytes — AssetStorage (or existing file paths) do.
 */
export class MediaAssetRepository {
  catalog(input: CatalogInput): MediaLibraryAsset {
    const db = getDb()
    const tags = [...new Set(input.tags.map((t) => t.toLowerCase()).filter(Boolean))]
    let sha256 = input.sha256
    if (!sha256) {
      if (!fs.existsSync(input.path)) throw new Error('library_catalog_missing_file')
      sha256 = assetRegistry.computeChecksum(input.path)
    }

    const existing = db
      .prepare(
        `SELECT * FROM media_library_assets WHERE workspace_id = ? AND sha256 = ? LIMIT 1`,
      )
      .get(input.workspaceId, sha256) as Record<string, unknown> | undefined

    const now = nowIso()
    if (existing) {
      db.prepare(
        `UPDATE media_library_assets
         SET usage_count = usage_count + 1, last_used_at = ?,
             tags = CASE WHEN length(tags) < length(?) THEN ? ELSE tags END
         WHERE id = ?`,
      ).run(now, JSON.stringify(tags), JSON.stringify(tags), String(existing.id))
      return this.get(String(existing.id))!
    }

    const id = uid()
    db.prepare(
      `INSERT INTO media_library_assets
       (id, workspace_id, content_id, production_id, path, sha256, type, source, tags,
        usage_count, metadata, created_at, last_used_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
    ).run(
      id,
      input.workspaceId,
      input.contentId ?? null,
      input.productionId ?? null,
      input.path,
      sha256,
      input.type,
      input.source,
      JSON.stringify(tags),
      JSON.stringify(input.metadata ?? {}),
      now,
      now,
    )
    return this.get(id)!
  }

  get(id: string): MediaLibraryAsset | null {
    const row = getDb()
      .prepare(`SELECT * FROM media_library_assets WHERE id = ?`)
      .get(id) as Record<string, unknown> | undefined
    return row ? rowToAsset(row) : null
  }

  findBySha256(workspaceId: string, sha256: string): MediaLibraryAsset | null {
    const row = getDb()
      .prepare(
        `SELECT * FROM media_library_assets WHERE workspace_id = ? AND sha256 = ? LIMIT 1`,
      )
      .get(workspaceId, sha256) as Record<string, unknown> | undefined
    return row ? rowToAsset(row) : null
  }

  /**
   * Exact/tag matching only (no embeddings).
   * Returns best hit with matchScore > 0, or null.
   */
  searchBest(input: {
    workspaceId: string
    type: LibraryAssetType
    tags: string[]
    minScore?: number
  }): LibrarySearchHit | null {
    const query = [...new Set(input.tags.map((t) => t.toLowerCase()).filter(Boolean))]
    if (!query.length) return null

    const rows = getDb()
      .prepare(
        `SELECT * FROM media_library_assets WHERE workspace_id = ? AND type = ? ORDER BY usage_count DESC, created_at DESC LIMIT 200`,
      )
      .all(input.workspaceId, input.type) as Array<Record<string, unknown>>

    const minScore = input.minScore ?? 0.34
    let best: LibrarySearchHit | null = null
    for (const row of rows) {
      const asset = rowToAsset(row)
      const { matched, score } = scoreTagOverlap(query, asset.tags)
      if (score < minScore || matched.length === 0) continue
      if (!best || score > best.matchScore) {
        best = {
          asset,
          matchedTags: matched,
          matchScore: score,
          reuseReason: 'tag_match',
        }
      }
    }
    return best
  }

  /** Observable reuse: bump counters + return audit fields. */
  recordReuse(id: string): MediaLibraryAsset {
    const now = nowIso()
    getDb()
      .prepare(
        `UPDATE media_library_assets SET usage_count = usage_count + 1, last_used_at = ? WHERE id = ?`,
      )
      .run(now, id)
    const asset = this.get(id)
    if (!asset) throw new Error('library_asset_not_found')
    return asset
  }

  listByWorkspace(workspaceId: string, limit = 100): MediaLibraryAsset[] {
    return (
      getDb()
        .prepare(
          `SELECT * FROM media_library_assets WHERE workspace_id = ? ORDER BY COALESCE(last_used_at, created_at) DESC, created_at DESC LIMIT ?`,
        )
        .all(workspaceId, limit) as Array<Record<string, unknown>>
    ).map(rowToAsset)
  }
}

export const mediaAssetRepository = new MediaAssetRepository()
