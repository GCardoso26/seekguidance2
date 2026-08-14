import fs from 'node:fs'
import { getDb, uid, nowIso } from '../../db/client.js'
import { assetRegistry } from '../AssetRegistry.js'
import type { LibraryQualityStatus } from '../visual/visualTypes.js'
import { visualQaMinScore } from '../visual/VisualQaService.js'

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
  qualityStatus: LibraryQualityStatus
  qualityScore: number
  qualityFindings: string[]
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
  qualityStatus?: LibraryQualityStatus
  qualityScore?: number
  qualityFindings?: string[]
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
  'subject',
  'action',
  'environment',
  'camera',
  'lighting',
  'style',
  'mood',
  'quality',
  'palette',
  'character',
  'lock',
  'years',
  'old',
  'navy',
  'charcoal',
  'shirt',
  'short',
  'dark',
  'hair',
  'neat',
  'adult',
  'professional',
  'brazilian',
  'european',
  'southern',
  'naturalistic',
  'features',
  'beauty',
  'filters',
  'logos',
  'smart',
  'casual',
  'recurring',
  'every',
  'same',
  'wearing',
  'photorealistic',
  'documentary',
  'photography',
  'editorial',
  'cinematic',
  'vertical',
  'frame',
  'shallow',
  'depth',
  'field',
  'medium',
  'close',
  'shot',
  'natural',
  'daylight',
  'window',
  'soft',
  'clean',
  'muted',
  'neutral',
  'palette',
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

function parseFindings(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String)
  if (typeof raw === 'string') {
    try {
      const v = JSON.parse(raw || '[]')
      return Array.isArray(v) ? v.map(String) : []
    } catch {
      return []
    }
  }
  return []
}

function rowToAsset(row: Record<string, unknown>): MediaLibraryAsset {
  const statusRaw = String(row.quality_status || 'PENDING').toUpperCase()
  const qualityStatus: LibraryQualityStatus =
    statusRaw === 'APPROVED' || statusRaw === 'REJECTED' ? statusRaw : 'PENDING'
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
    qualityStatus,
    qualityScore: Number(row.quality_score || 0),
    qualityFindings: parseFindings(row.quality_findings),
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

/** Prefer real provenance when tag scores tie — never let mock bars outrank Comfy frames. */
function sourceRank(source: LibraryAssetSource): number {
  if (source === 'generated' || source === 'stock' || source === 'uploaded') return 2
  return 1
}

/**
 * Catalog / search / reuse for the Asset Library.
 * Does not own bytes — AssetStorage (or existing file paths) do.
 * Reuse only APPROVED assets above the aesthetic threshold.
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

    const qualityStatus = input.qualityStatus || 'PENDING'
    const qualityScore = Number(input.qualityScore ?? 0)
    const qualityFindings = JSON.stringify(input.qualityFindings ?? [])

    const existing = db
      .prepare(
        `SELECT * FROM media_library_assets WHERE workspace_id = ? AND sha256 = ? LIMIT 1`,
      )
      .get(input.workspaceId, sha256) as Record<string, unknown> | undefined

    const now = nowIso()
    if (existing) {
      // REJECTED is sticky. PENDING may be promoted to APPROVED after a fresh QA pass.
      // APPROVED may be demoted to REJECTED if a later QA fails.
      const prev = rowToAsset(existing)
      let nextStatus = prev.qualityStatus
      let nextScore = prev.qualityScore
      if (qualityStatus === 'REJECTED') {
        nextStatus = 'REJECTED'
        nextScore = Math.min(prev.qualityScore || 1, qualityScore)
      } else if (qualityStatus === 'APPROVED' && prev.qualityStatus !== 'REJECTED') {
        nextStatus = 'APPROVED'
        nextScore = Math.max(prev.qualityScore, qualityScore)
      } else if (qualityStatus === 'PENDING' && prev.qualityStatus === 'PENDING') {
        nextStatus = 'PENDING'
        nextScore = qualityScore
      }
      db.prepare(
        `UPDATE media_library_assets
         SET usage_count = usage_count + 1, last_used_at = ?,
             tags = CASE WHEN length(tags) < length(?) THEN ? ELSE tags END,
             quality_status = ?, quality_score = ?, quality_findings = ?
         WHERE id = ?`,
      ).run(
        now,
        JSON.stringify(tags),
        JSON.stringify(tags),
        nextStatus,
        nextScore,
        qualityFindings,
        String(existing.id),
      )
      return this.get(String(existing.id))!
    }

    const id = uid()
    db.prepare(
      `INSERT INTO media_library_assets
       (id, workspace_id, content_id, production_id, path, sha256, type, source, tags,
        usage_count, metadata, created_at, last_used_at, quality_status, quality_score, quality_findings)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?)`,
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
      qualityStatus,
      qualityScore,
      qualityFindings,
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
   * Returns best APPROVED hit with matchScore > 0, or null.
   */
  searchBest(input: {
    workspaceId: string
    type: LibraryAssetType
    tags: string[]
    minScore?: number
    minQualityScore?: number
  }): LibrarySearchHit | null {
    const query = [...new Set(input.tags.map((t) => t.toLowerCase()).filter(Boolean))]
    if (!query.length) return null

    const rows = getDb()
      .prepare(
        `SELECT * FROM media_library_assets
         WHERE workspace_id = ? AND type = ? AND quality_status = 'APPROVED'
         ORDER BY quality_score DESC, usage_count DESC, created_at DESC LIMIT 200`,
      )
      .all(input.workspaceId, input.type) as Array<Record<string, unknown>>

    const minScore = input.minScore ?? 0.34
    const minQuality = input.minQualityScore ?? visualQaMinScore()
    let best: LibrarySearchHit | null = null
    for (const row of rows) {
      const asset = rowToAsset(row)
      if (asset.qualityScore < minQuality) continue
      if (asset.source === 'mock') continue
      const { matched, score } = scoreTagOverlap(query, asset.tags)
      if (score < minScore || matched.length === 0) continue
      if (
        !best ||
        score > best.matchScore ||
        (score === best.matchScore && asset.qualityScore > best.asset.qualityScore) ||
        (score === best.matchScore &&
          asset.qualityScore === best.asset.qualityScore &&
          sourceRank(asset.source) > sourceRank(best.asset.source))
      ) {
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
