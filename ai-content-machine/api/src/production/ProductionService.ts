import fs from 'node:fs'
import { config } from '../config.js'
import { getDb, uid, nowIso } from '../db/client.js'
import { emitEvent } from '../services/EventService.js'
import { alreadyProcessed, markProcessed } from '../lib/idempotency.js'
import { withRetry } from '../lib/retry.js'
import { recordAiCost } from '../services/AiCostService.js'
import { buildProductionPlan, buildStoryboard } from './ProductionPlanner.js'
import { assetRegistry } from './AssetRegistry.js'
import { LocalFilesystemStorage, assetRelPath } from './storage/LocalFilesystemStorage.js'
import { MockVoiceProvider } from './voice/MockVoiceProvider.js'
import { RealVoiceProvider } from './voice/RealVoiceProvider.js'
import { KokoroVoiceProvider } from './voice/KokoroVoiceProvider.js'
import { FallbackVoiceProvider } from './voice/FallbackVoiceProvider.js'
import { createVisualResolver } from './visual/createVisualResolver.js'
import type { VisualFallbackAttempt } from './visual/FallbackVisualProvider.js'
import {
  deriveTagsFromPrompt,
  mediaAssetRepository,
  type LibraryAssetSource,
  type LibrarySearchHit,
} from './library/MediaAssetRepository.js'
import { subtitleService } from './SubtitleService.js'
import { videoComposer } from './VideoComposer.js'
import { collectFactoryMetrics, type FactoryRunMetrics } from './FactoryMetrics.js'
import { MockThumbnailProvider } from './thumbnail/MockThumbnailProvider.js'
import { mediaQaService } from './MediaQAService.js'
import { buildContentPackageManifest } from './ContentPackageBuilder.js'
import { ffmpegService } from './FFmpegService.js'
import {
  STAGE_ORDER,
  type ProductionPlan,
  type ProductionStage,
  type StoryboardScene,
  type PackageStatus,
} from './types.js'

export type ProductionRunInput = {
  workspaceId: string
  scriptId: string
  contentId?: string
  platform?: string
  executionId?: string
  /** skip approval check — tests only */
  allowUnapproved?: boolean
  forceFailStage?: ProductionStage
  forceFailTimes?: number
  targetDurationOverride?: number
  regenerate?: boolean
}

type StageState = {
  ok: boolean
  completedAt?: string
  error?: string
  attempts?: number
  assetIds?: string[]
  version?: number
  /** Which engine actually produced this stage (Kokoro/mock, library/ComfyUI, ffmpeg_kenburns…). */
  provider?: string
  fallbackTrail?: Array<{ provider?: string; status?: string }>
  library?: {
    hits: number
    misses: number
    reuses: Array<{
      asset_id: string
      reuse_reason: string
      matched_tags: string[]
      match_score: number
      scene: number
    }>
  }
  kenBurnsScenes?: number
  durationMs?: number
}

type RunResult = {
  stages: Partial<Record<ProductionStage, StageState>>
  storyboard?: StoryboardScene[]
  failedStage?: ProductionStage | null
  qa?: Record<string, unknown>
  packageId?: string
  stageVersions?: Partial<Record<ProductionStage, number>>
  factoryMetrics?: FactoryRunMetrics
}

function parseResult(raw: string | null | undefined): RunResult {
  try {
    return JSON.parse(raw || '{}') as RunResult
  } catch {
    return { stages: {} }
  }
}

function isScriptApproved(script: {
  status?: string | null
  qa_status?: string | null
}): boolean {
  if (script.status === 'approved') return true
  if (script.status === 'ready' && script.qa_status === 'passed') return true
  return false
}

function productionIdemKey(scriptId: string, platform: string) {
  return `production:${scriptId}:${platform}`
}

function stageIdemKey(productionId: string, stage: ProductionStage, version: number) {
  return `production:${productionId}:${stage}:v${version}`
}

/**
 * Library HITs are already-vetted assets (previously cataloged with a known
 * provenance) — never demote them to license 'UNKNOWN', which would force
 * REQUIRES_REVIEW on an otherwise-ready package.
 */
function libraryAssetLicense(source: LibraryAssetSource): string {
  switch (source) {
    case 'mock':
      return 'MOCK'
    case 'generated':
      return 'GENERATED'
    case 'stock':
      return 'STOCK'
    case 'uploaded':
      return 'UPLOADED'
    default:
      return 'MOCK'
  }
}

function librarySourceType(source: LibraryAssetSource): 'MOCK' | 'GENERATED' | 'STOCK' | 'UPLOADED' {
  switch (source) {
    case 'mock':
      return 'MOCK'
    case 'stock':
      return 'STOCK'
    case 'uploaded':
      return 'UPLOADED'
    case 'generated':
    default:
      return 'GENERATED'
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/**
 * Test-speed cap only. Not tied to AUTOMATION_MODE — a real Kokoro voice under
 * AUTOMATION_MODE=mock must still get its full platform-profile duration
 * (~40s for YOUTUBE_SHORT), never a hardcoded 3s.
 */
function capDurationForFastTests(planDuration: number, override?: number): number {
  if (override) return Math.max(1, override)
  if (config.fastMedia) return Math.min(planDuration, 3)
  return planDuration
}

export class ProductionService {
  private storage = new LocalFilesystemStorage()
  private mockVoice = new MockVoiceProvider()
  private realVoice = new RealVoiceProvider()
  private kokoroVoice = new KokoroVoiceProvider()
  /** ProductionService only talks to the resolver — not the individual engines. */
  private voice = new FallbackVoiceProvider(this.kokoroVoice, this.realVoice, this.mockVoice)
  /** ProductionService only talks to the resolver — not ComfyUI. MISS-only. */
  private visual = createVisualResolver()
  private thumbnail = new MockThumbnailProvider()
  private stageFailCounters = new Map<string, number>()

  providersStatus() {
    return {
      voice: {
        resolver: this.voice.name,
        kokoro: this.kokoroVoice.status(),
        real: this.realVoice.status(),
        mock: this.mockVoice.status(),
        status: this.voice.status(),
      },
      visual: {
        resolver: this.visual.name,
        comfy: this.visual.chain()[0]?.status() ?? 'NOT_CONFIGURED',
        mock: this.visual.chain()[1]?.status() ?? 'NOT_CONFIGURED',
        status: this.visual.status(),
        stock: 'NOT_CONFIGURED',
        videoGeneration: 'NOT_CONFIGURED',
      },
      thumbnail: { mock: this.thumbnail.status() },
      storage: { local: 'READY', s3: 'NOT_CONFIGURED' },
      ffmpeg: ffmpegService.available() ? 'READY' : 'NOT_CONFIGURED',
      composition: {
        ffmpeg_kenburns: ffmpegService.available() ? 'READY' : 'NOT_CONFIGURED',
      },
    }
  }

  /**
   * Approval gate as a lookup instead of a thrown error, so HTTP callers can answer
   * 404/409 with guidance rather than turning an operator mistake into a 500 + dead letter.
   */
  checkScriptEligibility(
    workspaceId: string,
    scriptId: string,
  ):
    | { ok: true; scriptStatus: string; qaStatus: string }
    | { ok: false; code: 'script_not_found' }
    | { ok: false; code: 'script_not_approved'; scriptStatus: string; qaStatus: string } {
    const script = getDb()
      .prepare(`SELECT status, qa_status FROM scripts WHERE id = ? AND workspace_id = ?`)
      .get(scriptId, workspaceId) as { status: string; qa_status: string } | undefined
    if (!script) return { ok: false, code: 'script_not_found' }
    if (!isScriptApproved(script)) {
      return {
        ok: false,
        code: 'script_not_approved',
        scriptStatus: script.status,
        qaStatus: script.qa_status,
      }
    }
    return { ok: true, scriptStatus: script.status, qaStatus: script.qa_status }
  }

  getRun(id: string) {
    const run = getDb().prepare(`SELECT * FROM production_runs WHERE id = ?`).get(id) as
      | Record<string, unknown>
      | undefined
    if (!run) return null
    const assets = assetRegistry.listByProduction(id)
    const pkg = getDb()
      .prepare(`SELECT * FROM content_packages WHERE production_id = ?`)
      .get(id)
    return { ...run, assets, package: pkg, providers: this.providersStatus() }
  }

  listRuns(workspaceId: string, limit = 50) {
    return getDb()
      .prepare(
        `SELECT * FROM production_runs WHERE workspace_id = ? ORDER BY created_at DESC LIMIT ?`,
      )
      .all(workspaceId, limit)
  }

  listAssetsByContent(contentId: string) {
    return assetRegistry.listByContent(contentId)
  }

  async createProductionRun(input: ProductionRunInput) {
    return this.run(input)
  }

  async run(input: ProductionRunInput) {
    const db = getDb()
    const script = db
      .prepare(`SELECT * FROM scripts WHERE id = ? AND workspace_id = ?`)
      .get(input.scriptId, input.workspaceId) as
      | {
          id: string
          status: string
          qa_status: string
          body: string
          visual_brief: string
          hook: string
          platform: string | null
          idea_id: string
        }
      | undefined

    if (!script) throw new Error('script_not_found')
    if (!input.allowUnapproved && !isScriptApproved(script)) {
      throw new Error('script_not_approved')
    }

    const platform = input.platform || script.platform || 'YOUTUBE_SHORT'
    const idempotencyKey = productionIdemKey(script.id, platform)
    const contentId = input.contentId || this.ensureContentShell(input.workspaceId, script)

    if (!input.regenerate) {
      const existing = db
        .prepare(`SELECT * FROM production_runs WHERE idempotency_key = ?`)
        .get(idempotencyKey) as
        | { id: string; status: string; package_status: string; quality_score: number | null; result: string }
        | undefined

      if (existing) {
        const terminal = ['COMPLETED', 'REQUIRES_REVIEW', 'CANCELLED'].includes(existing.status)
        if (terminal || alreadyProcessed(idempotencyKey)) {
          return {
            skipped: true,
            reason: 'idempotent_skip',
            // An idempotent skip must never look like a failure to the operator: say what
            // already exists and exactly how to force a new run.
            hint:
              `Já existe um production run ${existing.status} (package=${existing.package_status}) ` +
              `para este script em ${platform}. Reenvie com regenerate=true para forçar um novo run.`,
            nextAction: 'retry_with_regenerate' as const,
            existingProductionRunId: existing.id,
            productionRunId: existing.id,
            productionRun: existing,
            status: existing.status,
            packageStatus: existing.package_status,
            qualityScore: existing.quality_score,
            reality: 'MOCK' as const,
          }
        }
        // Reuse PARTIAL/FAILED run — continue from failed stage without duplicating
        for (const key of [...this.stageFailCounters.keys()]) {
          if (key.startsWith(`${existing.id}:`)) this.stageFailCounters.delete(key)
        }
        const prior = parseResult(existing.result)
        if (prior.failedStage && prior.stages[prior.failedStage]) {
          prior.stages[prior.failedStage] = { ok: false, error: 'retrying' }
          const idx = STAGE_ORDER.indexOf(prior.failedStage)
          for (const s of STAGE_ORDER.slice(idx + 1)) delete prior.stages[s]
          prior.failedStage = null
          db.prepare(`UPDATE production_runs SET result=?, error=NULL, updated_at=? WHERE id=?`).run(
            JSON.stringify(prior),
            nowIso(),
            existing.id,
          )
        }
        const outcome = await this.executePipeline(existing.id, {
          ...input,
          contentId: contentId,
          platform,
          script,
        })
        if (outcome.status === 'COMPLETED' || outcome.status === 'REQUIRES_REVIEW') {
          markProcessed({
            eventId: idempotencyKey,
            workflow: 'content_production',
            entityType: 'production_run',
            entityId: existing.id,
          })
        }
        return {
          skipped: false,
          productionRunId: existing.id,
          status: outcome.status,
          packageStatus: outcome.packageStatus,
          qualityScore: outcome.qualityScore,
          reality: outcome.reality,
          result: outcome.result,
          costCents: 0,
        }
      }
    }

    const runId = uid()
    const started = nowIso()
    const runIdemKey = input.regenerate ? `${idempotencyKey}:regen:${runId}` : idempotencyKey

    db.prepare(
      `INSERT INTO production_runs
       (id, workspace_id, content_id, script_id, status, current_stage, plan, package_status,
        reality, execution_id, idempotency_key, started_at, created_at, updated_at, result)
       VALUES (?, ?, ?, ?, 'QUEUED', NULL, '{}', 'INCOMPLETE', ?, ?, ?, ?, ?, ?, '{}')`,
    ).run(
      runId,
      input.workspaceId,
      contentId,
      script.id,
      config.automationMode === 'mock' ? 'MOCK' : 'PENDING',
      input.executionId ?? null,
      runIdemKey,
      started,
      started,
      started,
    )

    emitEvent({
      workspaceId: input.workspaceId,
      eventType: 'production.started',
      entityType: 'production_run',
      entityId: runId,
      reality: 'MOCK',
      payload: { scriptId: script.id, platform },
    })

    try {
      const outcome = await this.executePipeline(runId, {
        ...input,
        contentId,
        platform,
        script,
      })
      if (outcome.status === 'COMPLETED' || outcome.status === 'REQUIRES_REVIEW') {
        markProcessed({
          eventId: runIdemKey,
          workflow: 'content_production',
          entityType: 'production_run',
          entityId: runId,
        })
      }
      return {
        skipped: false,
        productionRunId: runId,
        status: outcome.status,
        packageStatus: outcome.packageStatus,
        qualityScore: outcome.qualityScore,
        reality: outcome.reality,
        result: outcome.result,
        costCents: 0,
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      db.prepare(
        `UPDATE production_runs SET status='FAILED', error=?, completed_at=?, updated_at=? WHERE id=?`,
      ).run(message, nowIso(), nowIso(), runId)
      this.toDlq(runId, 'PIPELINE', input.executionId, message, 1, input)
      emitEvent({
        workspaceId: input.workspaceId,
        eventType: 'production.failed',
        entityType: 'production_run',
        entityId: runId,
        reality: 'FAILED',
        payload: { error: message },
      })
      return {
        skipped: false,
        productionRunId: runId,
        status: 'FAILED' as const,
        error: message,
        reality: 'FAILED' as const,
      }
    }
  }

  private ensureContentShell(
    workspaceId: string,
    script: { id: string; idea_id: string; hook: string },
  ): string {
    const db = getDb()
    const existing = db
      .prepare(`SELECT id FROM contents WHERE script_id = ? LIMIT 1`)
      .get(script.id) as { id: string } | undefined
    if (existing) return existing.id
    const id = uid()
    db.prepare(
      `INSERT INTO contents
       (id, workspace_id, idea_id, script_id, title, status, approval_required, reality, created_at)
       VALUES (?, ?, ?, ?, ?, 'queued_production', 0, 'MOCK', ?)`,
    ).run(id, workspaceId, script.idea_id, script.id, script.hook.slice(0, 80) || 'Production', nowIso())
    return id
  }

  private async executePipeline(
    runId: string,
    ctx: ProductionRunInput & {
      contentId: string
      platform: string
      script: {
        id: string
        body: string
        visual_brief: string
        hook: string
        idea_id: string
      }
    },
  ) {
    const db = getDb()
    let result = parseResult(
      (db.prepare(`SELECT result FROM production_runs WHERE id=?`).get(runId) as { result: string })
        .result,
    )
    result.stages = result.stages || {}
    const stageVersions = (result.stageVersions = result.stageVersions || {})

    for (const stage of STAGE_ORDER) {
      const stageVersion = stageVersions[stage] || 1
      stageVersions[stage] = stageVersion

      if (result.stages[stage]?.ok) continue

      db.prepare(
        `UPDATE production_runs SET status=?, current_stage=?, updated_at=? WHERE id=?`,
      ).run(stage, stage, nowIso(), runId)

      const stageOut = await this.executeStage(runId, stage, stageVersion, ctx, result)
      result = stageOut.result

      if (!stageOut.ok) {
        const status = stage === 'PLANNING' ? 'FAILED' : 'PARTIAL'
        db.prepare(
          `UPDATE production_runs SET status=?, error=?, completed_at=?, updated_at=?, result=? WHERE id=?`,
        ).run(status, stageOut.error, nowIso(), nowIso(), JSON.stringify(result), runId)

        emitEvent({
          workspaceId: ctx.workspaceId,
          eventType: status === 'FAILED' ? 'production.failed' : 'production.failed',
          entityType: 'production_run',
          entityId: runId,
          reality: 'FAILED',
          payload: { stage, error: stageOut.error, partial: status === 'PARTIAL' },
        })

        return {
          status,
          packageStatus: 'INCOMPLETE' as PackageStatus,
          qualityScore: null,
          reality: 'FAILED' as const,
          result,
        }
      }
    }

    const row = db.prepare(`SELECT * FROM production_runs WHERE id=?`).get(runId) as {
      package_status: string
      quality_score: number | null
      status: string
      result: string
    }
    return {
      status: row.status,
      packageStatus: row.package_status as PackageStatus,
      qualityScore: row.quality_score,
      reality: 'MOCK' as const,
      result: parseResult(row.result),
    }
  }

  async executeStage(
    runId: string,
    stage: ProductionStage,
    version: number,
    ctx: ProductionRunInput & {
      contentId: string
      platform: string
      script: {
        id: string
        body: string
        visual_brief: string
        hook: string
        idea_id: string
      }
    },
    result: RunResult,
  ): Promise<{ ok: boolean; error?: string; result: RunResult }> {
    const idem = stageIdemKey(runId, stage, version)
    if (alreadyProcessed(idem) && result.stages[stage]?.ok) {
      return { ok: true, result }
    }

    const failKey = `${runId}:${stage}`
    const retried = await withRetry(async () => {
      const n = (this.stageFailCounters.get(failKey) || 0) + 1
      this.stageFailCounters.set(failKey, n)
      if (ctx.forceFailStage === stage && n <= (ctx.forceFailTimes ?? 1)) {
        throw new Error(`forced_stage_fail:${stage}:${n}`)
      }
      await this.runStageWork(runId, stage, version, ctx, result)
    })

    if (!retried.ok) {
      result.stages[stage] = {
        ok: false,
        error: retried.failure.error,
        attempts: retried.failure.attempts,
      }
      result.failedStage = stage
      this.toDlq(
        runId,
        stage,
        ctx.executionId,
        retried.failure.error,
        retried.failure.attempts,
        ctx,
      )
      getDb()
        .prepare(`UPDATE production_runs SET result=?, retry_count=retry_count+?, updated_at=? WHERE id=?`)
        .run(JSON.stringify(result), retried.failure.attempts, nowIso(), runId)
      return { ok: false, error: retried.failure.error, result }
    }

    const prior: Partial<StageState> = result.stages[stage] || {}
    result.stages[stage] = {
      ...prior,
      ok: true,
      completedAt: nowIso(),
      version,
      assetIds: prior.assetIds,
    }
    result.failedStage = null
    getDb()
      .prepare(`UPDATE production_runs SET result=?, updated_at=? WHERE id=?`)
      .run(JSON.stringify(result), nowIso(), runId)
    markProcessed({
      eventId: idem,
      workflow: 'content_production',
      entityType: 'production_stage',
      entityId: `${runId}:${stage}:v${version}`,
    })
    return { ok: true, result }
  }

  private async runStageWork(
    runId: string,
    stage: ProductionStage,
    version: number,
    ctx: ProductionRunInput & {
      contentId: string
      platform: string
      script: {
        id: string
        body: string
        visual_brief: string
        hook: string
        idea_id: string
      }
    },
    result: RunResult,
  ) {
    const body = JSON.parse(ctx.script.body || '{}') as Record<string, string>
    const visualBrief = JSON.parse(ctx.script.visual_brief || '{}') as Record<string, unknown>
    const ws = ctx.workspaceId
    const contentId = ctx.contentId

    if (stage === 'PLANNING') {
      const profileDuration = buildProductionPlan({ platform: ctx.platform, visualBrief }).targetDuration
      const plan = buildProductionPlan({
        platform: ctx.platform,
        visualBrief,
        targetDurationOverride: capDurationForFastTests(profileDuration, ctx.targetDurationOverride),
      })
      const storyboard = buildStoryboard({ plan, scriptBody: body, visualBrief })
      result.storyboard = storyboard
      getDb()
        .prepare(`UPDATE production_runs SET plan=?, updated_at=? WHERE id=?`)
        .run(JSON.stringify(plan), nowIso(), runId)
      emitEvent({
        workspaceId: ws,
        eventType: 'production.planned',
        entityType: 'production_run',
        entityId: runId,
        reality: 'MOCK',
        payload: { platform: plan.platform, scenes: storyboard.length },
      })
      return
    }

    const plan = JSON.parse(
      (getDb().prepare(`SELECT plan FROM production_runs WHERE id=?`).get(runId) as { plan: string })
        .plan,
    ) as ProductionPlan
    const storyboard = result.storyboard || buildStoryboard({ plan, scriptBody: body, visualBrief })
    result.storyboard = storyboard

    if (stage === 'VOICE') {
      const t0 = Date.now()
      const rel = assetRelPath({
        workspaceId: ws,
        contentId,
        productionId: runId,
        folder: 'voice',
        filename: `voice-v${version}.wav`,
      })
      const abs = this.storage.resolveSafe(rel)
      const voiceText = [body.hook, body.setup, body.problem, body.insight, body.value, body.proof, body.cta]
        .filter(Boolean)
        .join('. ')
      const voice = await this.voice.generate({
        text: voiceText,
        outPath: abs,
        durationSec: plan.targetDuration,
        sampleRate: plan.voice.sampleRate,
      })

      // A real narration engine (Kokoro) decides the true runtime — the plan must
      // follow the voice, not the other way around. Test-speed caps (fast media
      // flag or an explicit override) opt out so mock runs stay fast and small.
      const skipDurationAdjust = Boolean(ctx.targetDurationOverride) || config.fastMedia
      if (!skipDurationAdjust && voice.duration > 0) {
        const adjustedDuration = clamp(voice.duration, 15, 60)
        if (Math.abs(adjustedDuration - plan.targetDuration) > 0.05) {
          plan.targetDuration = adjustedDuration
          result.storyboard = buildStoryboard({ plan, scriptBody: body, visualBrief })
          getDb()
            .prepare(`UPDATE production_runs SET plan=?, updated_at=? WHERE id=?`)
            .run(JSON.stringify(plan), nowIso(), runId)
        }
      }

      const registered = assetRegistry.register({
        workspaceId: ws,
        contentId,
        productionId: runId,
        type: 'AUDIO',
        sourceType: voice.sourceType,
        provider: voice.provider,
        uri: voice.path,
        mimeType: voice.mimeType,
        duration: voice.duration,
        stage: 'VOICE',
        assetKey: 'voice',
        version,
        license: voice.sourceType === 'MOCK' ? 'MOCK' : 'GENERATED',
        metadata: {
          format: plan.voice.format,
          fallbackTrail: voice.fallbackTrail,
        },
      })
      recordAiCost({
        workspaceId: ws,
        operation: 'VOICE_GENERATION',
        provider: voice.provider,
        model: voice.provider === 'mock_voice' ? 'mock-tone' : voice.provider,
        estimatedCostCents: voice.costCents,
        productionRunId: runId,
        reality: voice.sourceType === 'MOCK' ? 'MOCK' : 'REAL',
      })
      result.stages.VOICE = {
        ok: true,
        assetIds: [registered.id],
        version,
        provider: voice.provider,
        fallbackTrail: voice.fallbackTrail,
        durationMs: Date.now() - t0,
      }
      emitEvent({
        workspaceId: ws,
        eventType: 'voice.generated',
        entityType: 'media_asset',
        entityId: registered.id,
        reality: voice.sourceType === 'MOCK' ? 'MOCK' : 'REAL',
        payload: { provider: voice.provider, fallbackTrail: voice.fallbackTrail },
      })
      return
    }

    if (stage === 'VISUALS') {
      const t0 = Date.now()
      const ids: string[] = []
      const libraryReuses: Array<{
        asset_id: string
        reuse_reason: string
        matched_tags: string[]
        match_score: number
        scene: number
      }> = []
      let libraryHits = 0
      let libraryMisses = 0
      let lastVisualProvider = 'asset_library'
      const visualTrail: VisualFallbackAttempt[] = []

      for (const scene of storyboard) {
        const rel = assetRelPath({
          workspaceId: ws,
          contentId,
          productionId: runId,
          folder: 'visuals',
          filename: `scene-${scene.scene}-v${version}.png`,
        })
        const abs = this.storage.resolveSafe(rel)
        const tags = deriveTagsFromPrompt(scene.visualPrompt)

        let hit: LibrarySearchHit | null = null
        try {
          hit = mediaAssetRepository.searchBest({
            workspaceId: ws,
            type: 'image',
            tags,
          })
          if (hit && !fs.existsSync(hit.asset.path)) hit = null
        } catch {
          // Asset Library must never block production — fall through to visual provider
          hit = null
        }

        if (hit) {
          try {
            const reused = mediaAssetRepository.recordReuse(hit.asset.id)
            const license = libraryAssetLicense(hit.asset.source)
            const registered = assetRegistry.register({
              workspaceId: ws,
              contentId,
              productionId: runId,
              type: 'IMAGE',
              sourceType: librarySourceType(hit.asset.source),
              provider: 'asset_library',
              uri: hit.asset.path,
              mimeType: 'image/png',
              width: plan.width,
              height: plan.height,
              checksum: hit.asset.sha256,
              stage: 'VISUALS',
              assetKey: `visual:scene:${scene.scene}`,
              version,
              license,
              metadata: {
                prompt: scene.visualPrompt,
                sourceUrl: `library://${hit.asset.id}`,
                generatedAt: nowIso(),
                scene: scene.scene,
                library: {
                  asset_id: hit.asset.id,
                  reuse_reason: hit.reuseReason,
                  matched_tags: hit.matchedTags,
                  match_score: hit.matchScore,
                  usage_count: reused.usageCount,
                },
              },
            })
            ids.push(registered.id)
            libraryHits += 1
            libraryReuses.push({
              asset_id: hit.asset.id,
              reuse_reason: hit.reuseReason,
              matched_tags: hit.matchedTags,
              match_score: hit.matchScore,
              scene: scene.scene,
            })
            recordAiCost({
              workspaceId: ws,
              operation: 'IMAGE_GENERATION',
              provider: 'asset_library',
              model: 'reuse',
              estimatedCostCents: 0,
              productionRunId: runId,
              reality: 'MOCK',
            })
            continue
          } catch {
            // Library reuse failed — fall through to provider
          }
        }

        // MISS (or library unavailable) — visual resolver; catalog stays here.
        libraryMisses += 1
        const asset = await this.visual.generate({
          prompt: scene.visualPrompt,
          outPath: abs,
          width: plan.width,
          height: plan.height,
          scene: scene.scene,
        })
        lastVisualProvider = asset.provider
        if (asset.fallbackTrail?.length) visualTrail.push(...asset.fallbackTrail)
        const license = asset.license || 'UNKNOWN'
        const registered = assetRegistry.register({
          workspaceId: ws,
          contentId,
          productionId: runId,
          type: 'IMAGE',
          sourceType: asset.sourceType,
          provider: asset.provider,
          uri: asset.path,
          mimeType: asset.mimeType,
          width: asset.width,
          height: asset.height,
          stage: 'VISUALS',
          assetKey: `visual:scene:${scene.scene}`,
          version,
          license,
          reality: asset.sourceType === 'MOCK' ? 'MOCK' : 'REAL',
          metadata: {
            ...asset.metadata,
            prompt: asset.prompt,
            sourceUrl: asset.metadata.sourceUrl,
            generatedAt: asset.metadata.generatedAt,
            library: { miss: true, tags },
            fallbackTrail: asset.fallbackTrail,
          },
        })
        ids.push(registered.id)

        try {
          mediaAssetRepository.catalog({
            workspaceId: ws,
            contentId,
            productionId: runId,
            path: asset.path,
            type: 'image',
            source: asset.sourceType === 'STOCK' ? 'stock' : asset.sourceType === 'GENERATED' ? 'generated' : 'mock',
            tags,
            metadata: {
              prompt: asset.prompt,
              scene: scene.scene,
              provider: asset.provider,
              width: asset.width,
              height: asset.height,
              sha256: asset.metadata.sha256,
              workflow: asset.metadata.workflow,
            },
          })
        } catch {
          // Catalog failure is non-fatal
        }

        recordAiCost({
          workspaceId: ws,
          operation: 'IMAGE_GENERATION',
          provider: asset.provider,
          model: String(asset.metadata.workflow || asset.provider),
          estimatedCostCents: asset.costCents,
          productionRunId: runId,
          reality: asset.sourceType === 'MOCK' ? 'MOCK' : 'REAL',
        })
        if (license === 'UNKNOWN') {
          getDb()
            .prepare(`UPDATE production_runs SET status='REQUIRES_REVIEW', updated_at=? WHERE id=?`)
            .run(nowIso(), runId)
        }
      }
      result.stages.VISUALS = {
        ok: true,
        assetIds: ids,
        version,
        provider: libraryMisses === 0 ? 'asset_library' : lastVisualProvider,
        fallbackTrail: visualTrail,
        library: { hits: libraryHits, misses: libraryMisses, reuses: libraryReuses },
        durationMs: Date.now() - t0,
      }
      emitEvent({
        workspaceId: ws,
        eventType: 'visuals.generated',
        entityType: 'production_run',
        entityId: runId,
        reality: 'MOCK',
        payload: { count: ids.length, libraryHits, libraryMisses },
      })
      return
    }

    if (stage === 'SUBTITLES') {
      const pack = subtitleService.build(storyboard, plan.targetDuration)
      if (pack.qa.status === 'FAIL') throw new Error(`subtitle_qa_fail:${pack.qa.issues.join(',')}`)
      const ids: string[] = []
      for (const [fmt, bodyText] of [
        ['srt', pack.srt],
        ['vtt', pack.vtt],
      ] as const) {
        const rel = assetRelPath({
          workspaceId: ws,
          contentId,
          productionId: runId,
          folder: 'subtitles',
          filename: `subs-v${version}.${fmt}`,
        })
        const put = await this.storage.put(rel, bodyText)
        const registered = assetRegistry.register({
          workspaceId: ws,
          contentId,
          productionId: runId,
          type: 'SUBTITLE',
          sourceType: 'MOCK',
          provider: 'subtitle_service',
          uri: put.uri,
          mimeType: fmt === 'srt' ? 'application/x-subrip' : 'text/vtt',
          fileSize: put.fileSize,
          checksum: put.checksum,
          stage: 'SUBTITLES',
          assetKey: `subtitle:${fmt}`,
          version,
          license: 'MOCK',
          metadata: { format: fmt, cues: pack.cues.length },
        })
        ids.push(registered.id)
      }
      result.stages.SUBTITLES = { ok: true, assetIds: ids, version }
      emitEvent({
        workspaceId: ws,
        eventType: 'subtitles.generated',
        entityType: 'production_run',
        entityId: runId,
        reality: 'MOCK',
      })
      return
    }

    if (stage === 'COMPOSING') {
      const t0 = Date.now()
      const voice = assetRegistry.getCurrent(runId, 'voice') as { uri: string } | undefined
      const visuals = assetRegistry.listCurrentByType(runId, 'IMAGE') as Array<{ uri: string }>
      const srt = assetRegistry.getCurrent(runId, 'subtitle:srt') as { uri: string } | undefined
      if (!voice) throw new Error('compose_missing_voice_asset')
      const rel = assetRelPath({
        workspaceId: ws,
        contentId,
        productionId: runId,
        folder: 'final',
        filename: `final-v${version}.mp4`,
      })
      const abs = this.storage.resolveSafe(rel)
      const composed = videoComposer.compose({
        plan,
        audioPath: voice.uri,
        imagePaths: visuals.map((v) => v.uri),
        outPath: abs,
        storyboard,
        subtitlePath: srt?.uri,
        musicPath: null,
      })
      const registered = assetRegistry.register({
        workspaceId: ws,
        contentId,
        productionId: runId,
        type: 'FINAL_VIDEO',
        sourceType: 'MOCK',
        provider: composed.provider,
        uri: composed.path,
        mimeType: 'video/mp4',
        duration: composed.duration,
        width: composed.width,
        height: composed.height,
        stage: 'COMPOSING',
        assetKey: 'final_video',
        version,
        license: 'MOCK',
        metadata: {
          codec: 'h264',
          audio: 'aac',
          fps: plan.fps,
          kenBurns: composed.kenBurns.map((s) => ({
            scene: s.scene,
            motion: s.motion,
            durationSec: s.durationSec,
          })),
          usedSubtitles: composed.usedSubtitles,
          usedMusic: composed.usedMusic,
        },
      })
      recordAiCost({
        workspaceId: ws,
        operation: 'VIDEO_GENERATION',
        provider: composed.provider,
        model: 'libx264_kenburns',
        estimatedCostCents: 0,
        productionRunId: runId,
        reality: 'MOCK',
      })
      result.stages.COMPOSING = {
        ok: true,
        assetIds: [registered.id],
        version,
        provider: composed.provider,
        kenBurnsScenes: composed.kenBurns.length,
        durationMs: Date.now() - t0,
      }
      emitEvent({
        workspaceId: ws,
        eventType: 'video.composed',
        entityType: 'media_asset',
        entityId: registered.id,
        reality: 'MOCK',
        payload: {
          provider: composed.provider,
          motions: composed.kenBurns.map((s) => s.motion),
        },
      })
      return
    }

    if (stage === 'THUMBNAIL') {
      const rel = assetRelPath({
        workspaceId: ws,
        contentId,
        productionId: runId,
        folder: 'thumbnails',
        filename: `thumb-v${version}.png`,
      })
      const abs = this.storage.resolveSafe(rel)
      const thumbMeta = await this.thumbnail.generate({
        hook: ctx.script.hook,
        topic: String(body.insight || body.hook || 'topic'),
        brand: 'NEXUS IA',
        visualStyle: 'dark vertical',
        outPath: abs,
        width: plan.thumbnail.width,
        height: plan.thumbnail.height,
      })
      const tqa = mediaQaService.validateThumbnail(
        thumbMeta.path,
        plan.thumbnail.width,
        plan.thumbnail.height,
      )
      if (tqa.status === 'FAIL') throw new Error(`thumbnail_qa_fail:${tqa.issues.join(',')}`)
      const registered = assetRegistry.register({
        workspaceId: ws,
        contentId,
        productionId: runId,
        type: 'THUMBNAIL',
        sourceType: 'MOCK',
        provider: thumbMeta.provider,
        uri: thumbMeta.path,
        mimeType: thumbMeta.mimeType,
        width: plan.thumbnail.width,
        height: plan.thumbnail.height,
        stage: 'THUMBNAIL',
        assetKey: 'thumbnail',
        version,
        license: 'MOCK',
        metadata: { concept: thumbMeta.concept, text: thumbMeta.text },
      })
      result.stages.THUMBNAIL = { ok: true, assetIds: [registered.id], version }
      emitEvent({
        workspaceId: ws,
        eventType: 'thumbnail.generated',
        entityType: 'media_asset',
        entityId: registered.id,
        reality: 'MOCK',
      })
      return
    }

    if (stage === 'QA') {
      const final = assetRegistry.getCurrent(runId, 'final_video') as { uri: string } | undefined
      const thumb = assetRegistry.getCurrent(runId, 'thumbnail') as { uri: string } | undefined
      const subs = assetRegistry.listCurrentByType(runId, 'SUBTITLE')
      const assets = assetRegistry.listByProduction(runId) as Array<Record<string, unknown>>
      const cues = subtitleService.build(storyboard, plan.targetDuration).cues
      const licensesKnown = assets
        .filter((a) => a.is_current)
        .every((a) => a.license && a.license !== 'UNKNOWN')
      const qa = mediaQaService.validateFinalVideo({
        videoPath: final?.uri || '',
        plan,
        hasSubtitles: subs.length > 0,
        subtitleCues: cues,
        thumbnailPath: thumb?.uri,
        licensesKnown,
        assetsComplete: Boolean(
          result.stages.VOICE?.ok &&
            result.stages.VISUALS?.ok &&
            result.stages.SUBTITLES?.ok &&
            result.stages.COMPOSING?.ok &&
            result.stages.THUMBNAIL?.ok,
        ),
      })
      result.qa = qa as unknown as Record<string, unknown>
      getDb()
        .prepare(
          `UPDATE production_runs SET quality_score=?, quality_breakdown=?, updated_at=? WHERE id=?`,
        )
        .run(qa.qualityScore, JSON.stringify(qa.qualityBreakdown), nowIso(), runId)

      if (qa.status === 'FAIL') {
        emitEvent({
          workspaceId: ws,
          eventType: 'production.qa_failed',
          entityType: 'production_run',
          entityId: runId,
          reality: 'FAILED',
          payload: { issues: qa.issues },
        })
        throw new Error(`media_qa_fail:${qa.issues.join(',')}`)
      }
      if (qa.status === 'REQUIRES_REVIEW') {
        getDb()
          .prepare(`UPDATE production_runs SET status='REQUIRES_REVIEW', updated_at=? WHERE id=?`)
          .run(nowIso(), runId)
        emitEvent({
          workspaceId: ws,
          eventType: 'production.qa_failed',
          entityType: 'production_run',
          entityId: runId,
          reality: 'MOCK',
          payload: { issues: qa.issues, requiresReview: true },
        })
      } else {
        emitEvent({
          workspaceId: ws,
          eventType: 'production.qa_passed',
          entityType: 'production_run',
          entityId: runId,
          reality: 'MOCK',
        })
      }
      result.stages.QA = { ok: true, version }
      return
    }

    if (stage === 'STORAGE') {
      // Files already on LocalFilesystemStorage paths; verify + cost 0 + package
      const assets = assetRegistry.listByProduction(runId) as Array<Record<string, unknown>>
      for (const a of assets.filter((x) => x.is_current)) {
        if (!fs.existsSync(String(a.uri))) throw new Error(`storage_missing:${a.asset_key}`)
        if (!a.checksum || String(a.checksum).length !== 64) throw new Error(`checksum_invalid:${a.asset_key}`)
      }
      recordAiCost({
        workspaceId: ws,
        operation: 'STORAGE',
        provider: 'local_filesystem',
        model: 'fs',
        estimatedCostCents: 0,
        productionRunId: runId,
        reality: 'MOCK',
      })

      const qaStatus = String((result.qa as { status?: string } | undefined)?.status || 'PASS')
      const licensesKnown = assets
        .filter((a) => a.is_current)
        .every((a) => a.license && a.license !== 'UNKNOWN')
      const pack = buildContentPackageManifest({
        scriptId: ctx.script.id,
        productionId: runId,
        platform: plan.platform,
        assets,
        qaStatus,
        licensesKnown,
        noUnresolvedFailure: !result.failedStage,
      })

      let packageStatus = pack.status
      let runStatus = 'COMPLETED'
      if (packageStatus === 'READY_FOR_PUBLISH') {
        runStatus = 'COMPLETED'
      } else if (packageStatus === 'FAILED') {
        runStatus = 'FAILED'
      } else {
        runStatus = 'REQUIRES_REVIEW'
        packageStatus = 'READY_FOR_REVIEW'
      }

      getDb().prepare(`DELETE FROM content_packages WHERE production_id = ?`).run(runId)
      const pkgId = uid()
      getDb()
        .prepare(
          `INSERT INTO content_packages
           (id, workspace_id, content_id, production_id, status, manifest, reality, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, 'MOCK', ?, ?)`,
        )
        .run(
          pkgId,
          ws,
          contentId,
          runId,
          packageStatus,
          JSON.stringify(pack.manifest),
          nowIso(),
          nowIso(),
        )

      result.packageId = pkgId
      result.stages.STORAGE = { ok: true, version }

      const finalAsset = assetRegistry.getCurrent(runId, 'final_video') as { uri?: string } | undefined
      const runRow = getDb()
        .prepare(`SELECT started_at, completed_at FROM production_runs WHERE id=?`)
        .get(runId) as { started_at?: string; completed_at?: string } | undefined
      result.factoryMetrics = collectFactoryMetrics({
        productionStartedAt: runRow?.started_at,
        productionCompletedAt: nowIso(),
        stages: result.stages as Record<string, { ok?: boolean; durationMs?: number; provider?: string; fallbackTrail?: Array<{ status?: string }>; library?: { hits?: number; misses?: number } }>,
        finalVideoPath: finalAsset?.uri,
        packageStatus,
        success: runStatus === 'COMPLETED' || runStatus === 'REQUIRES_REVIEW',
      })

      getDb()
        .prepare(
          `UPDATE production_runs SET status=?, package_status=?, current_stage='STORAGE',
           completed_at=?, updated_at=?, result=? WHERE id=?`,
        )
        .run(runStatus, packageStatus, nowIso(), nowIso(), JSON.stringify(result), runId)

      getDb()
        .prepare(`UPDATE contents SET status=?, asset_meta=?, updated_at=? WHERE id=?`)
        .run(
          packageStatus === 'READY_FOR_PUBLISH' ? 'qa' : 'pending_approval',
          JSON.stringify({ productionId: runId, packageStatus }),
          nowIso(),
          contentId,
        )

      emitEvent({
        workspaceId: ws,
        eventType: 'production.completed',
        entityType: 'production_run',
        entityId: runId,
        reality: 'MOCK',
        payload: { packageStatus, runStatus },
      })
    }
  }

  async retryStage(productionId: string, stage?: ProductionStage, executionId?: string) {
    const db = getDb()
    const run = db.prepare(`SELECT * FROM production_runs WHERE id = ?`).get(productionId) as
      | {
          id: string
          workspace_id: string
          content_id: string
          script_id: string
          status: string
          result: string
          plan: string
        }
      | undefined
    if (!run) throw new Error('production_run_not_found')
    if (run.status === 'CANCELLED') throw new Error('production_cancelled')

    const result = parseResult(run.result)
    const target =
      stage ||
      result.failedStage ||
      (STAGE_ORDER.find((s) => !result.stages?.[s]?.ok) as ProductionStage | undefined)
    if (!target) throw new Error('no_failed_stage')

    // Clear only target stage success so pipeline resumes from there
    if (result.stages[target]) result.stages[target] = { ok: false, error: 'retrying' }
    // Invalidate later stages
    const idx = STAGE_ORDER.indexOf(target)
    for (const s of STAGE_ORDER.slice(idx + 1)) {
      delete result.stages[s]
    }
    result.failedStage = null
    db.prepare(
      `UPDATE production_runs SET status=?, current_stage=?, error=NULL, result=?, updated_at=? WHERE id=?`,
    ).run(target, target, JSON.stringify(result), nowIso(), productionId)

    const script = db
      .prepare(`SELECT * FROM scripts WHERE id = ?`)
      .get(run.script_id) as {
      id: string
      body: string
      visual_brief: string
      hook: string
      idea_id: string
      platform: string | null
    }

    const plan = JSON.parse(run.plan || '{}') as ProductionPlan
    const ctx = {
      workspaceId: run.workspace_id,
      scriptId: run.script_id,
      contentId: run.content_id,
      platform: plan.platform || script.platform || 'YOUTUBE_SHORT',
      executionId,
      script,
      allowUnapproved: true,
    }

    this.stageFailCounters.delete(`${productionId}:${target}`)
    const outcome = await this.executePipeline(productionId, ctx)
    return {
      productionRunId: productionId,
      retriedStage: target,
      status: outcome.status,
      packageStatus: outcome.packageStatus,
      reality: outcome.reality,
      result: outcome.result,
    }
  }

  async regenerate(productionId: string, stageRaw: string) {
    const map: Record<string, ProductionStage> = {
      voice: 'VOICE',
      visuals: 'VISUALS',
      scene: 'VISUALS',
      subtitles: 'SUBTITLES',
      video: 'COMPOSING',
      composition: 'COMPOSING',
      composing: 'COMPOSING',
      thumbnail: 'THUMBNAIL',
      qa: 'QA',
      storage: 'STORAGE',
      planning: 'PLANNING',
    }
    const stage = map[stageRaw.toLowerCase()]
    if (!stage) throw new Error(`unknown_regenerate_stage:${stageRaw}`)

    const db = getDb()
    const run = db.prepare(`SELECT * FROM production_runs WHERE id = ?`).get(productionId) as
      | { result: string; status: string }
      | undefined
    if (!run) throw new Error('production_run_not_found')
    if (run.status === 'CANCELLED') throw new Error('production_cancelled')

    const result = parseResult(run.result)
    result.stageVersions = result.stageVersions || {}
    const next = (result.stageVersions[stage] || 1) + 1
    result.stageVersions[stage] = next
    delete result.stages[stage]
    const idx = STAGE_ORDER.indexOf(stage)
    for (const s of STAGE_ORDER.slice(idx + 1)) {
      delete result.stages[s]
      result.stageVersions[s] = (result.stageVersions[s] || 1) + 1
    }
    db.prepare(`UPDATE production_runs SET result=?, updated_at=? WHERE id=?`).run(
      JSON.stringify(result),
      nowIso(),
      productionId,
    )
    return this.retryStage(productionId, stage)
  }

  cancelRun(productionId: string) {
    const db = getDb()
    db.prepare(
      `UPDATE production_runs SET status='CANCELLED', completed_at=?, updated_at=? WHERE id=? AND status NOT IN ('COMPLETED','CANCELLED')`,
    ).run(nowIso(), nowIso(), productionId)
    return this.getRun(productionId)
  }

  completeRun(productionId: string) {
    getDb()
      .prepare(
        `UPDATE production_runs SET status='COMPLETED', completed_at=?, updated_at=? WHERE id=?`,
      )
      .run(nowIso(), nowIso(), productionId)
    return this.getRun(productionId)
  }

  private toDlq(
    productionId: string,
    stage: string,
    executionId: string | undefined,
    error: string,
    attempts: number,
    payload: unknown,
  ) {
    getDb()
      .prepare(
        `INSERT INTO automation_failures
         (id, workflow, execution_id, entity_type, entity_id, error, payload, attempts, status, created_at)
         VALUES (?, 'content_production', ?, 'production_run', ?, ?, ?, ?, 'open', ?)`,
      )
      .run(
        uid(),
        executionId ?? productionId,
        productionId,
        error,
        JSON.stringify({ productionId, stage, payload }),
        attempts,
        nowIso(),
      )
  }
}

export const productionService = new ProductionService()
