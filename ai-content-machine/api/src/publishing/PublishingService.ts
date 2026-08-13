import fs from 'node:fs'
import { config } from '../config.js'
import { getDb, uid, nowIso } from '../db/client.js'
import { emitEvent } from '../services/EventService.js'
import { alreadyProcessed, markProcessed } from '../lib/idempotency.js'
import { withRetry } from '../lib/retry.js'
import { recordAiCost } from '../services/AiCostService.js'
import { resolvePlatform } from '../scriptFactory/PlatformProfiles.js'
import { MockPublisher } from './MockPublisher.js'
import { youtubePublisher } from './youtube/YouTubePublisher.js'
import {
  tiktokPublisher,
  instagramPublisher,
  pinterestPublisher,
} from './adapters.js'
import { buildPublicationMetadata } from './PublicationMetadataBuilder.js'
import { evaluatePublishingSafety, safetySnapshot } from './PublishingSafety.js'
import type { PlatformPublisher } from './PlatformPublisher.js'
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
  /** Opt-in for REAL_PROVIDER_E2E — still subject to kill switches */
  forceReal?: boolean
}

function pubIdemKey(workspaceId: string, contentId: string, platform: string, version: number) {
  return `publication:${workspaceId}:${contentId}:${platform}:v${version}`
}

export class PublishingService {
  private mock = new MockPublisher()
  private failCounters = new Map<string, number>()

  providersStatus() {
    return {
      mock: this.mock.status(),
      youtube: youtubePublisher.status(),
      tiktok: tiktokPublisher.status(),
      instagram: instagramPublisher.status(),
      pinterest: pinterestPublisher.status(),
      safety: safetySnapshot(),
    }
  }

  resolvePublisher(platform: string, useReal: boolean): PlatformPublisher {
    const p = platform.toUpperCase()
    if (!useReal) return this.mock
    if (p.includes('YOUTUBE')) return youtubePublisher
    if (p.includes('TIKTOK')) return tiktokPublisher
    if (p.includes('INSTAGRAM')) return instagramPublisher
    if (p.includes('PINTEREST')) return pinterestPublisher
    return this.mock
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

    const metadata = buildPublicationMetadata(input.contentId, input.scheduledAt, platform)
    const safety = evaluatePublishingSafety({
      workspaceId: input.workspaceId,
      contentId: input.contentId,
      platform,
      forceReal: input.forceReal,
    })
    const useReal = safety.allowReal
    const publicationSource = useReal ? 'REAL' : 'MOCK'
    const publisher = this.resolvePublisher(platform, useReal)

    db.prepare(
      `UPDATE publication_runs SET metadata=?, production_run_id=?, package_id=?, publication_source=?,
       dry_run=?, updated_at=? WHERE id=?`,
    ).run(
      JSON.stringify(metadata),
      validation.productionRunId ?? null,
      validation.packageId ?? null,
      publicationSource,
      safety.dryRun ? 1 : 0,
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

    // Dry-run real path: validate + prepare, never upload
    const mode = process.env.AUTOMATION_MODE || config.automationMode
    if (safety.dryRun && (input.forceReal || mode === 'production')) {
      const dry =
        publisher === youtubePublisher
          ? await youtubePublisher.prepareDryRun(publishInput)
          : {
              wouldPublish: false,
              contentId: input.contentId,
              platform,
              title: metadata.title,
              file: publishInput.videoUri,
              thumbnail: publishInput.thumbnailUri,
              metadata,
              validation: { ok: true, issues: [], reason: safety.reason },
            }
      db.prepare(
        `UPDATE publication_runs SET status='REQUIRES_REVIEW', dry_run=1, upload_outcome='DRY_RUN',
         result=?, completed_at=?, updated_at=?, error=? WHERE id=?`,
      ).run(
        JSON.stringify({ dryRun: true, safety, wouldPublish: dry }),
        nowIso(),
        nowIso(),
        safety.reason || 'DRY_RUN',
        runId,
      )
      emitEvent({
        workspaceId: input.workspaceId,
        eventType: 'publication.upload_started',
        entityType: 'publication_run',
        entityId: runId,
        reality: 'MOCK',
        payload: { dryRun: true, code: safety.code },
      })
      return {
        skipped: false,
        publicationRunId: runId,
        status: 'REQUIRES_REVIEW' as const,
        dryRun: true,
        safety,
        wouldPublish: dry,
        reality: 'MOCK' as const,
      }
    }

    const failKey = `${runId}:publish`
    const retried = await withRetry(async () => {
      const n = (this.failCounters.get(failKey) || 0) + 1
      this.failCounters.set(failKey, n)
      if (n <= (input.forceFailTimes ?? 0)) throw new Error(`forced_publish_fail_${n}`)

      // Before unsafe upload retry: check remote status if we may have succeeded
      if (n > 1 && useReal && publisher === youtubePublisher) {
        const prev = db.prepare(`SELECT external_id, upload_outcome FROM publication_runs WHERE id=?`).get(runId) as
          | { external_id: string | null; upload_outcome: string | null }
          | undefined
        if (prev?.external_id || prev?.upload_outcome === 'UNKNOWN') {
          emitEvent({
            workspaceId: input.workspaceId,
            eventType: 'publication.status_checked',
            entityType: 'publication_run',
            entityId: runId,
            reality: 'REAL',
            payload: { attempt: n },
          })
          if (prev.external_id) {
            const remote = await youtubePublisher.getPublication(prev.external_id, input.workspaceId)
            if (remote.found) {
              return {
                mode: 'published' as const,
                result: {
                  ok: true,
                  reality: 'PENDING' as const,
                  externalId: remote.externalId,
                  externalUrl: remote.externalUrl,
                  publishedAt: nowIso(),
                  confirmation: 'recovered_from_remote_status',
                },
                uploadOutcome: 'SUCCESS' as const,
              }
            }
          }
        }
      }

      if (input.scheduledAt && new Date(input.scheduledAt).getTime() > Date.now() + 1000) {
        this.setStatus(runId, 'SCHEDULED')
        const scheduled = await publisher.schedule(publishInput)
        if (!scheduled.ok) throw new Error(scheduled.error || 'schedule_failed')
        emitEvent({
          workspaceId: input.workspaceId,
          eventType: 'publication.scheduled',
          entityType: 'publication_run',
          entityId: runId,
          reality: publicationSource === 'REAL' ? 'REAL' : 'MOCK',
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
        return { mode: 'scheduled' as const, result: scheduled, uploadOutcome: 'SUCCESS' as const }
      }

      this.setStatus(runId, 'PUBLISHING')
      emitEvent({
        workspaceId: input.workspaceId,
        eventType: 'publication.upload_started',
        entityType: 'publication_run',
        entityId: runId,
        reality: publicationSource === 'REAL' ? 'REAL' : 'MOCK',
        payload: { provider: publisher.name },
      })
      const published = (await publisher.publish(publishInput)) as {
        ok: boolean
        reality: 'MOCK' | 'FAILED' | 'PENDING'
        externalId?: string
        externalUrl?: string
        publishedAt?: string
        confirmation?: string
        error?: string
        uploadOutcome?: string
      }
      if (!published.ok) {
        if (published.uploadOutcome === 'UNKNOWN') {
          db.prepare(
            `UPDATE publication_runs SET upload_outcome='UNKNOWN', remote_status='UNKNOWN', error=?, updated_at=? WHERE id=?`,
          ).run(published.error || 'unknown', nowIso(), runId)
          emitEvent({
            workspaceId: input.workspaceId,
            eventType: 'publication.upload_unknown',
            entityType: 'publication_run',
            entityId: runId,
            reality: 'PENDING',
            payload: { error: published.error },
          })
          // Do not auto-FAIL — surface UNKNOWN without aggressive retry as FAILED
          throw new Error(`UNKNOWN_OUTCOME:${published.error || 'upload'}`)
        }
        if (published.uploadOutcome === 'RATE_LIMITED') {
          throw new Error(`RETRY_SCHEDULED:${published.error}`)
        }
        throw new Error(published.error || 'publish_failed')
      }
      return {
        mode: 'published' as const,
        result: published,
        uploadOutcome: (published.uploadOutcome || 'SUCCESS') as string,
      }
    })

    if (!retried.ok) {
      const unknown = retried.failure.error.startsWith('UNKNOWN_OUTCOME')
      if (unknown) {
        db.prepare(
          `UPDATE publication_runs SET status='REQUIRES_REVIEW', upload_outcome='UNKNOWN', completed_at=?, updated_at=?, error=? WHERE id=?`,
        ).run(nowIso(), nowIso(), retried.failure.error, runId)
        return {
          skipped: false,
          publicationRunId: runId,
          status: 'REQUIRES_REVIEW' as const,
          uploadOutcome: 'UNKNOWN',
          error: retried.failure.error,
          reality: 'PENDING' as const,
        }
      }
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
        provider: publisher.name,
        model: publicationSource === 'REAL' ? 'youtube' : 'mock',
        estimatedCostCents: 0,
        reality: publicationSource === 'REAL' ? 'REAL' : 'MOCK',
      })
      return {
        skipped: false,
        publicationRunId: runId,
        status: 'SCHEDULED' as const,
        reality: (publicationSource === 'REAL' ? 'REAL' : 'MOCK') as 'REAL' | 'MOCK',
        publicationSource,
        result: retried.value.result,
        costCents: 0,
      }
    }

    const pub = retried.value.result
    const reality = publicationSource === 'REAL' ? 'REAL' : 'MOCK'
    db.prepare(
      `UPDATE publication_runs SET status='PUBLISHED', published_at=?, external_id=?, external_url=?,
       completed_at=?, updated_at=?, result=?, reality=?, publication_source=?, upload_outcome=? WHERE id=?`,
    ).run(
      pub.publishedAt ?? nowIso(),
      pub.externalId ?? null,
      pub.externalUrl ?? null,
      nowIso(),
      nowIso(),
      JSON.stringify(pub),
      reality,
      publicationSource,
      retried.value.uploadOutcome || 'SUCCESS',
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
      JSON.stringify({
        ...prevMeta,
        publicationRunId: runId,
        packageStatus: 'PUBLISHED',
        publicationSource,
      }),
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
      eventType: 'publication.upload_completed',
      entityType: 'publication_run',
      entityId: runId,
      reality,
      payload: { externalId: pub.externalId, publicationSource },
    })
    emitEvent({
      workspaceId: input.workspaceId,
      eventType: 'publication.published',
      entityType: 'publication_run',
      entityId: runId,
      reality,
      payload: {
        externalId: pub.externalId,
        externalUrl: pub.externalUrl,
        platform,
        confirmation: pub.confirmation,
        publicationSource,
      },
    })
    emitEvent({
      workspaceId: input.workspaceId,
      eventType: 'content.published',
      entityType: 'content',
      entityId: input.contentId,
      reality,
      payload: { publicationRunId: runId, externalId: pub.externalId, publicationSource },
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
      provider: publisher.name,
      model: publicationSource === 'REAL' ? 'youtube' : 'mock',
      estimatedCostCents: 0,
      reality,
    })

    return {
      skipped: false,
      publicationRunId: runId,
      status: 'PUBLISHED' as const,
      externalId: pub.externalId,
      externalUrl: pub.externalUrl,
      reality,
      publicationSource,
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
