import fs from 'node:fs'
import { config } from '../config.js'
import { getDb, uid, nowIso } from '../db/client.js'
import { emitEvent } from '../services/EventService.js'
import { alreadyProcessed, markProcessed } from '../lib/idempotency.js'
import { withRetry } from '../lib/retry.js'
import { recordAiCost } from '../services/AiCostService.js'
import { resolvePlatform } from '../scriptFactory/PlatformProfiles.js'
import { MockPublisher } from './MockPublisher.js'
import { buildPublicationMetadata } from './PublicationMetadataBuilder.js'
import type { PublicationPlatform, PublicationStatus } from './types.js'

export type PublishingRunInput = {
  workspaceId: string
  contentId: string
  platform?: string
  scheduledAt?: string | null
  executionId?: string
  publicationVersion?: number
  forceFailTimes?: number
  skipFeedback?: boolean
}

function pubIdemKey(workspaceId: string, contentId: string, platform: string, version: number) {
  return `publication:${workspaceId}:${contentId}:${platform}:v${version}`
}

export class PublishingService {
  private publisher = new MockPublisher()
  private failCounters = new Map<string, number>()

  providersStatus() {
    return {
      mock: this.publisher.status(),
      youtube: 'NOT_CONFIGURED',
      tiktok: 'NOT_CONFIGURED',
      instagram: 'NOT_CONFIGURED',
      pinterest: 'NOT_CONFIGURED',
    }
  }

  getPublication(id: string) {
    const run = getDb().prepare(`SELECT * FROM publication_runs WHERE id = ?`).get(id)
    return run || null
  }

  listPublications(workspaceId: string, limit = 50) {
    return getDb()
      .prepare(
        `SELECT * FROM publication_runs WHERE workspace_id = ? ORDER BY created_at DESC LIMIT ?`,
      )
      .all(workspaceId, limit)
  }

  async createPublication(input: PublishingRunInput) {
    return this.run(input)
  }

  validateContentPackage(contentId: string, workspaceId: string) {
    const db = getDb()
    const issues: string[] = []
    const content = db
      .prepare(`SELECT * FROM contents WHERE id = ? AND workspace_id = ?`)
      .get(contentId, workspaceId) as
      | { id: string; asset_meta: string; status: string }
      | undefined
    if (!content) return { ok: false, issues: ['content_not_found'], requiresReview: true }

    const pkg = db
      .prepare(
        `SELECT * FROM content_packages WHERE content_id = ? ORDER BY created_at DESC LIMIT 1`,
      )
      .get(contentId) as
      | { id: string; status: string; production_id: string; manifest: string }
      | undefined

    if (!pkg) issues.push('package_missing')
    else if (pkg.status !== 'READY_FOR_PUBLISH' && pkg.status !== 'PUBLISHED') {
      issues.push(`package_not_ready:${pkg.status}`)
    }

    const assetMeta = (() => {
      try {
        return JSON.parse(content.asset_meta || '{}') as { productionId?: string; packageStatus?: string }
      } catch {
        return {}
      }
    })()
    const productionId = pkg?.production_id || assetMeta.productionId
    if (!productionId) issues.push('production_missing')

    let videoUri: string | undefined
    let thumbnailUri: string | undefined
    if (productionId) {
      const video = db
        .prepare(
          `SELECT * FROM media_assets WHERE production_id = ? AND type='FINAL_VIDEO' AND is_current=1`,
        )
        .get(productionId) as { uri: string; checksum: string; license: string } | undefined
      const thumb = db
        .prepare(
          `SELECT * FROM media_assets WHERE production_id = ? AND type='THUMBNAIL' AND is_current=1`,
        )
        .get(productionId) as { uri: string } | undefined
      if (!video?.uri || !fs.existsSync(video.uri)) issues.push('final_video_missing')
      else videoUri = video.uri
      if (!thumb?.uri || !fs.existsSync(thumb.uri)) issues.push('thumbnail_missing')
      else thumbnailUri = thumb.uri
      if (video && (!video.checksum || video.checksum.length !== 64)) issues.push('checksum_invalid')
      if (video?.license === 'UNKNOWN') issues.push('license_unknown')

      const prod = db.prepare(`SELECT * FROM production_runs WHERE id = ?`).get(productionId) as
        | { status: string; quality_score: number | null; error: string | null }
        | undefined
      if (prod?.status === 'FAILED' || prod?.status === 'PARTIAL') {
        issues.push('unresolved_production_failure')
      }
      if (prod && prod.quality_score != null && prod.quality_score < 40) {
        issues.push('video_qa_weak')
      }
    }

    const requiresReview =
      issues.includes('license_unknown') ||
      issues.includes('package_not_ready:READY_FOR_REVIEW') ||
      issues.some((i) => i.startsWith('package_not_ready'))

    return {
      ok: issues.length === 0,
      issues,
      requiresReview: !!(requiresReview || issues.length),
      packageId: pkg?.id,
      productionRunId: productionId,
      videoUri,
      thumbnailUri,
    }
  }

  async run(input: PublishingRunInput) {
    const db = getDb()
    const platform = resolvePlatform(input.platform) as PublicationPlatform
    const version = input.publicationVersion ?? 1
    const idem = pubIdemKey(input.workspaceId, input.contentId, platform, version)

    if (alreadyProcessed(idem)) {
      const existing = db
        .prepare(`SELECT * FROM publication_runs WHERE idempotency_key = ?`)
        .get(idem)
      return {
        skipped: true,
        reason: 'idempotent_skip',
        publicationRunId: (existing as { id?: string } | undefined)?.id,
        publicationRun: existing,
        status: (existing as { status?: string } | undefined)?.status,
        reality: 'MOCK' as const,
      }
    }

    const existingRow = db
      .prepare(`SELECT * FROM publication_runs WHERE idempotency_key = ?`)
      .get(idem) as { id: string; status: string } | undefined
    if (existingRow && ['PUBLISHED', 'SCHEDULED', 'CANCELLED'].includes(existingRow.status)) {
      return {
        skipped: true,
        reason: 'idempotent_skip',
        publicationRunId: existingRow.id,
        status: existingRow.status,
        reality: 'MOCK' as const,
      }
    }

    const runId = existingRow?.id || uid()
    const started = nowIso()
    if (!existingRow) {
      db.prepare(
        `INSERT INTO publication_runs
         (id, workspace_id, content_id, platform, status, reality, execution_id, idempotency_key,
          publication_version, scheduled_at, started_at, created_at, updated_at, metadata, result)
         VALUES (?, ?, ?, ?, 'QUEUED', ?, ?, ?, ?, ?, ?, ?, ?, '{}', '{}')`,
      ).run(
        runId,
        input.workspaceId,
        input.contentId,
        platform,
        config.automationMode === 'mock' ? 'MOCK' : 'PENDING',
        input.executionId ?? null,
        idem,
        version,
        input.scheduledAt ?? null,
        started,
        started,
        started,
      )
    }

    emitEvent({
      workspaceId: input.workspaceId,
      eventType: 'publication.started',
      entityType: 'publication_run',
      entityId: runId,
      reality: 'MOCK',
      payload: { contentId: input.contentId, platform },
    })

    try {
      return await this.executePublish(runId, input, platform, idem)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      this.fail(runId, message, input)
      return {
        skipped: false,
        publicationRunId: runId,
        status: 'FAILED' as const,
        error: message,
        reality: 'FAILED' as const,
      }
    }
  }

  private async executePublish(
    runId: string,
    input: PublishingRunInput,
    platform: PublicationPlatform,
    idem: string,
  ) {
    const db = getDb()
    this.setStatus(runId, 'VALIDATING')

    const validation = this.validateContentPackage(input.contentId, input.workspaceId)
    if (!validation.ok) {
      const status: PublicationStatus = validation.requiresReview ? 'REQUIRES_REVIEW' : 'FAILED'
      db.prepare(
        `UPDATE publication_runs SET status=?, error=?, production_run_id=?, package_id=?,
         completed_at=?, updated_at=? WHERE id=?`,
      ).run(
        status,
        validation.issues.join(','),
        validation.productionRunId ?? null,
        validation.packageId ?? null,
        nowIso(),
        nowIso(),
        runId,
      )
      emitEvent({
        workspaceId: input.workspaceId,
        eventType: 'publication.failed',
        entityType: 'publication_run',
        entityId: runId,
        reality: 'FAILED',
        payload: { issues: validation.issues },
      })
      if (status === 'FAILED') {
        this.toDlq(runId, 'VALIDATING', input.executionId, validation.issues.join(','), 1, input)
      }
      return {
        skipped: false,
        publicationRunId: runId,
        status,
        error: validation.issues.join(','),
        reality: status === 'FAILED' ? ('FAILED' as const) : ('MOCK' as const),
      }
    }

    emitEvent({
      workspaceId: input.workspaceId,
      eventType: 'publication.validated',
      entityType: 'publication_run',
      entityId: runId,
      reality: 'MOCK',
    })

    const metadata = buildPublicationMetadata(input.contentId, input.scheduledAt)
    db.prepare(
      `UPDATE publication_runs SET metadata=?, production_run_id=?, package_id=?, updated_at=? WHERE id=?`,
    ).run(
      JSON.stringify(metadata),
      validation.productionRunId ?? null,
      validation.packageId ?? null,
      nowIso(),
      runId,
    )

    const publishInput = {
      workspaceId: input.workspaceId,
      contentId: input.contentId,
      publicationId: runId,
      platform,
      metadata,
      videoUri: validation.videoUri || metadata.video,
      thumbnailUri: validation.thumbnailUri || metadata.thumbnail,
      scheduledAt: input.scheduledAt,
    }

    const failKey = `${runId}:publish`
    const retried = await withRetry(async () => {
      const n = (this.failCounters.get(failKey) || 0) + 1
      this.failCounters.set(failKey, n)
      if (n <= (input.forceFailTimes ?? 0)) throw new Error(`forced_publish_fail_${n}`)

      if (input.scheduledAt && new Date(input.scheduledAt).getTime() > Date.now() + 1000) {
        this.setStatus(runId, 'SCHEDULED')
        const scheduled = await this.publisher.schedule(publishInput)
        if (!scheduled.ok) throw new Error(scheduled.error || 'schedule_failed')
        emitEvent({
          workspaceId: input.workspaceId,
          eventType: 'publication.scheduled',
          entityType: 'publication_run',
          entityId: runId,
          reality: 'MOCK',
          payload: { scheduledAt: scheduled.scheduledAt },
        })
        db.prepare(
          `UPDATE publication_runs SET status='SCHEDULED', scheduled_at=?, external_id=?, external_url=?,
           result=?, updated_at=? WHERE id=?`,
        ).run(
          scheduled.scheduledAt ?? input.scheduledAt,
          scheduled.externalId ?? null,
          scheduled.externalUrl ?? null,
          JSON.stringify(scheduled),
          nowIso(),
          runId,
        )
        return { mode: 'scheduled' as const, result: scheduled }
      }

      this.setStatus(runId, 'PUBLISHING')
      const published = await this.publisher.publish(publishInput)
      if (!published.ok) throw new Error(published.error || 'publish_failed')
      return { mode: 'published' as const, result: published }
    })

    if (!retried.ok) {
      this.fail(runId, retried.failure.error, input, retried.failure.attempts)
      return {
        skipped: false,
        publicationRunId: runId,
        status: 'FAILED' as const,
        error: retried.failure.error,
        reality: 'FAILED' as const,
      }
    }

    if (retried.value.mode === 'scheduled') {
      markProcessed({
        eventId: idem,
        workflow: 'content_publisher',
        entityType: 'publication_run',
        entityId: runId,
      })
      recordAiCost({
        workspaceId: input.workspaceId,
        operation: 'publishing',
        provider: 'mock_publisher',
        model: 'mock',
        estimatedCostCents: 0,
        reality: 'MOCK',
      })
      return {
        skipped: false,
        publicationRunId: runId,
        status: 'SCHEDULED' as const,
        reality: 'MOCK' as const,
        result: retried.value.result,
        costCents: 0,
      }
    }

    const pub = retried.value.result
    db.prepare(
      `UPDATE publication_runs SET status='PUBLISHED', published_at=?, external_id=?, external_url=?,
       completed_at=?, updated_at=?, result=?, reality='MOCK' WHERE id=?`,
    ).run(
      pub.publishedAt ?? nowIso(),
      pub.externalId ?? null,
      pub.externalUrl ?? null,
      nowIso(),
      nowIso(),
      JSON.stringify(pub),
      runId,
    )

    const prevMeta = (() => {
      try {
        return JSON.parse(
          (
            db.prepare(`SELECT asset_meta FROM contents WHERE id=?`).get(input.contentId) as {
              asset_meta: string
            }
          ).asset_meta || '{}',
        ) as Record<string, unknown>
      } catch {
        return {}
      }
    })()
    db.prepare(
      `UPDATE contents SET status='published', published_at=?, platform_post_id=?, updated_at=?, asset_meta=? WHERE id=?`,
    ).run(
      pub.publishedAt ?? nowIso(),
      pub.externalId ?? null,
      nowIso(),
      JSON.stringify({ ...prevMeta, publicationRunId: runId, packageStatus: 'PUBLISHED' }),
      input.contentId,
    )

    if (validation.packageId) {
      db.prepare(`UPDATE content_packages SET status='PUBLISHED', updated_at=? WHERE id=?`).run(
        nowIso(),
        validation.packageId,
      )
    }

    emitEvent({
      workspaceId: input.workspaceId,
      eventType: 'publication.published',
      entityType: 'publication_run',
      entityId: runId,
      reality: 'MOCK',
      payload: {
        externalId: pub.externalId,
        externalUrl: pub.externalUrl,
        platform,
        confirmation: pub.confirmation,
      },
    })

    // Also keep legacy content.published for Daily Engine compatibility
    emitEvent({
      workspaceId: input.workspaceId,
      eventType: 'content.published',
      entityType: 'content',
      entityId: input.contentId,
      reality: 'MOCK',
      payload: { publicationRunId: runId, externalId: pub.externalId },
    })

    markProcessed({
      eventId: idem,
      workflow: 'content_publisher',
      entityType: 'publication_run',
      entityId: runId,
    })

    recordAiCost({
      workspaceId: input.workspaceId,
      operation: 'publishing',
      provider: 'mock_publisher',
      model: 'mock',
      estimatedCostCents: 0,
      reality: 'MOCK',
    })

    return {
      skipped: false,
      publicationRunId: runId,
      status: 'PUBLISHED' as const,
      externalId: pub.externalId,
      externalUrl: pub.externalUrl,
      reality: 'MOCK' as const,
      result: pub,
      costCents: 0,
      contentId: input.contentId,
      platform,
    }
  }

  async schedule(input: PublishingRunInput & { scheduledAt: string }) {
    return this.run({ ...input, scheduledAt: input.scheduledAt })
  }

  async retry(publicationId: string, executionId?: string) {
    const db = getDb()
    const row = db.prepare(`SELECT * FROM publication_runs WHERE id = ?`).get(publicationId) as
      | {
          id: string
          workspace_id: string
          content_id: string
          platform: string
          status: string
          publication_version: number
          scheduled_at: string | null
        }
      | undefined
    if (!row) throw new Error('publication_not_found')
    if (row.status === 'CANCELLED') throw new Error('publication_cancelled')
    if (row.status === 'PUBLISHED') {
      return { skipped: true, reason: 'already_published', publicationRunId: row.id, status: row.status }
    }

    this.failCounters.delete(`${row.id}:publish`)
    // bump version only if previously marked processed under same key — clear idempotency for retry
    const idem = pubIdemKey(row.workspace_id, row.content_id, row.platform, row.publication_version)
    db.prepare(`DELETE FROM automation_events WHERE event_id = ?`).run(idem)
    db.prepare(
      `UPDATE publication_runs SET status='QUEUED', error=NULL, retry_count=retry_count+1, updated_at=? WHERE id=?`,
    ).run(nowIso(), row.id)

    return this.executePublish(
      row.id,
      {
        workspaceId: row.workspace_id,
        contentId: row.content_id,
        platform: row.platform,
        scheduledAt: row.scheduled_at,
        executionId,
      },
      row.platform as PublicationPlatform,
      idem,
    )
  }

  cancel(publicationId: string) {
    const db = getDb()
    db.prepare(
      `UPDATE publication_runs SET status='CANCELLED', completed_at=?, updated_at=?
       WHERE id=? AND status NOT IN ('PUBLISHED','CANCELLED')`,
    ).run(nowIso(), nowIso(), publicationId)
    const row = this.getPublication(publicationId) as { workspace_id?: string } | null
    if (row?.workspace_id) {
      emitEvent({
        workspaceId: row.workspace_id,
        eventType: 'publication.cancelled',
        entityType: 'publication_run',
        entityId: publicationId,
        reality: 'MOCK',
      })
    }
    return this.getPublication(publicationId)
  }

  private setStatus(id: string, status: PublicationStatus) {
    getDb()
      .prepare(`UPDATE publication_runs SET status=?, updated_at=? WHERE id=?`)
      .run(status, nowIso(), id)
  }

  private fail(runId: string, error: string, input: PublishingRunInput, attempts = 1) {
    getDb()
      .prepare(
        `UPDATE publication_runs SET status='FAILED', error=?, completed_at=?, updated_at=?, retry_count=? WHERE id=?`,
      )
      .run(error, nowIso(), nowIso(), attempts, runId)
    this.toDlq(runId, 'PUBLISHING', input.executionId, error, attempts, input)
    emitEvent({
      workspaceId: input.workspaceId,
      eventType: 'publication.failed',
      entityType: 'publication_run',
      entityId: runId,
      reality: 'FAILED',
      payload: { error },
    })
  }

  private toDlq(
    publicationId: string,
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
         VALUES (?, 'content_publisher', ?, 'publication_run', ?, ?, ?, ?, 'open', ?)`,
      )
      .run(
        uid(),
        executionId ?? publicationId,
        publicationId,
        error,
        JSON.stringify({ publicationId, stage, payload }),
        attempts,
        nowIso(),
      )
  }
}

export const publishingService = new PublishingService()
