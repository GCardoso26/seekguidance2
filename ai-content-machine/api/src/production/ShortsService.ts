import { config } from '../config.js'
import { getDb, uid, nowIso } from '../db/client.js'
import { scriptFactoryService } from '../scriptFactory/ScriptFactoryService.js'
import { productionService } from './ProductionService.js'
import { researchService } from '../research/ResearchService.js'
import { youtubePublisher } from '../publishing/youtube/YouTubePublisher.js'

export type CreateShortInput = {
  workspaceId: string
  topic: string
  style?: string
  durationSec?: number
  language?: string
  platform?: string
}

export class ShortsService {
  async create(input: CreateShortInput) {
    const db = getDb()
    const workspace = db.prepare(`SELECT id FROM workspaces WHERE id=?`).get(input.workspaceId)
    if (!workspace) throw Object.assign(new Error('workspace_not_found'), { statusCode: 404 })

    const niche = db
      .prepare(`SELECT id, name FROM niches WHERE workspace_id=? AND active=1 LIMIT 1`)
      .get(input.workspaceId) as { id: string; name: string } | undefined

    if (niche) {
      try {
        await researchService.run({
          workspaceId: input.workspaceId,
          nicheId: niche.id,
        })
      } catch {
        /* research optional */
      }
    }

    const ideaId = uid()
    db.prepare(
      `INSERT INTO content_ideas
       (id, workspace_id, topic_id, title, hooks, angles, formats, opportunity_score, status, reality, created_at)
       VALUES (?, ?, NULL, ?, '[]', ?, '["youtube_short"]', 0.7, 'selected', 'MOCK', ?)`,
    ).run(ideaId, input.workspaceId, input.topic, JSON.stringify([input.style || 'educational']), nowIso())

    const script = await scriptFactoryService.run({
      workspaceId: input.workspaceId,
      contentIdeaId: ideaId,
      platform: input.platform || 'YOUTUBE_SHORT',
    })
    if (script.skipped) {
      return { ...script, ideaId }
    }
    const scriptId = script.scriptId as string
    if (script.qaStatus === 'passed' || script.scriptStatus === 'ready') {
      db.prepare(`UPDATE scripts SET status='approved', qa_status='passed' WHERE id=?`).run(scriptId)
    }

    const prod = await productionService.run({
      workspaceId: input.workspaceId,
      scriptId,
      platform: 'YOUTUBE_SHORT',
      targetDurationOverride: input.durationSec,
      allowUnapproved: true,
    })

    return {
      ideaId,
      scriptId,
      productionRunId: prod.productionRunId,
      status: prod.status,
      packageStatus: prod.packageStatus,
      manualAssetRequests: (prod.result as { manualAssetRequests?: unknown })?.manualAssetRequests || [],
      skipped: false,
    }
  }

  dashboard(workspaceId: string) {
    const db = getDb()
    const runs = db
      .prepare(
        `SELECT status, package_status, error FROM production_runs WHERE workspace_id=? ORDER BY created_at DESC LIMIT 50`,
      )
      .all(workspaceId) as Array<{ status: string; package_status: string; error: string | null }>
    const waiting = runs.filter((r) => r.status === 'WAITING_ASSETS').length
    const review = runs.filter((r) => r.package_status === 'READY_FOR_REVIEW' || r.status === 'REQUIRES_REVIEW').length
    const publish = runs.filter((r) => r.package_status === 'READY_FOR_PUBLISH').length
    const producing = runs.filter((r) =>
      ['QUEUED', 'PLANNING', 'VOICE', 'VISUALS', 'SUBTITLES', 'COMPOSING', 'THUMBNAIL', 'QA', 'STORAGE'].includes(
        r.status,
      ),
    ).length
    let attention: unknown[] = []
    try {
      attention = db
        .prepare(
          `SELECT production_id, scene, scene_description, visual_intent, search_queries, status
           FROM manual_asset_requests WHERE workspace_id=? AND status='AWAITING_USER' ORDER BY created_at DESC LIMIT 20`,
        )
        .all(workspaceId)
    } catch {
      attention = []
    }
    return {
      greeting: greeting(),
      production: { producing, waitingAssets: waiting, awaitingApproval: review, readyToPublish: publish },
      attention,
      metrics: this.metrics(workspaceId),
      recent: db
        .prepare(
          `SELECT id, status, package_status, current_stage, created_at FROM production_runs
           WHERE workspace_id=? ORDER BY created_at DESC LIMIT 8`,
        )
        .all(workspaceId),
    }
  }

  metrics(workspaceId: string) {
    const db = getDb()
    const count = (sql: string, ...params: unknown[]) => {
      try {
        return Number((db.prepare(sql).get(...params) as { n?: number } | undefined)?.n || 0)
      } catch {
        return 0
      }
    }
    const videosCreated = count(`SELECT COUNT(*) as n FROM production_runs WHERE workspace_id=?`, workspaceId)
    const videosRendered = count(
      `SELECT COUNT(*) as n FROM production_runs WHERE workspace_id=? AND status IN ('COMPLETED','PARTIAL')`,
      workspaceId,
    )
    const videosPublished = count(
      `SELECT COUNT(*) as n FROM content_packages WHERE workspace_id=? AND status IN ('PUBLISHED','READY_FOR_PUBLISH')`,
      workspaceId,
    )
    const assetsDownloaded = count(
      `SELECT COUNT(*) as n FROM media_library_assets WHERE workspace_id=? AND source IN ('stock','generated','uploaded')`,
      workspaceId,
    )
    const assetsReused = count(
      `SELECT COALESCE(SUM(CASE WHEN usage_count > 1 THEN usage_count - 1 ELSE 0 END), 0) as n
       FROM media_library_assets WHERE workspace_id=?`,
      workspaceId,
    )
    const pexelsHits = count(
      `SELECT COUNT(*) as n FROM media_library_assets WHERE workspace_id=? AND json_extract(metadata, '$.provider') = 'pexels'`,
      workspaceId,
    )
    const pixabayHits = count(
      `SELECT COUNT(*) as n FROM media_library_assets WHERE workspace_id=? AND json_extract(metadata, '$.provider') = 'pixabay'`,
      workspaceId,
    )
    const manualAssetRequests = count(
      `SELECT COUNT(*) as n FROM manual_asset_requests WHERE workspace_id=?`,
      workspaceId,
    )
    const qaFailures = count(
      `SELECT COUNT(*) as n FROM production_runs WHERE workspace_id=? AND status='FAILED' AND current_stage='QA'`,
      workspaceId,
    )
    const renderFailures = count(
      `SELECT COUNT(*) as n FROM production_runs WHERE workspace_id=? AND current_stage='COMPOSING' AND status IN ('FAILED','PARTIAL')`,
      workspaceId,
    )
    const denom = assetsDownloaded + assetsReused
    return {
      videosCreated,
      videosRendered,
      videosPublished,
      assetsReused,
      assetsDownloaded,
      pexelsHits,
      pixabayHits,
      manualAssetRequests,
      renderFailures,
      qaFailures,
      assetReuseRate: denom ? Number((assetsReused / denom).toFixed(3)) : 0,
    }
  }

  systemHealth() {
    const production = productionService.providersStatus()
    const youtube = youtubePublisher.status ? youtubePublisher.status() : 'NOT_CONFIGURED'
    return {
      database: 'READY',
      ffmpeg: production.ffmpeg,
      kokoro: production.voice.kokoro,
      pexels: production.visual.pexels,
      pixabay: production.visual.pixabay,
      assetLibrary: 'READY',
      youtube,
      n8n: config.n8nBaseUrl ? 'READY' : 'NOT_CONFIGURED',
      comfy: production.visual.comfy,
      comfyOptional: true,
    }
  }
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia.'
  if (h < 18) return 'Boa tarde.'
  return 'Boa noite.'
}

export const shortsService = new ShortsService()
