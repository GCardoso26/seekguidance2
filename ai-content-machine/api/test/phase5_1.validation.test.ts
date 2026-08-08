import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import os from 'node:os'
import path from 'node:path'
import { resetDbForTests, getDb, uid, nowIso } from '../src/db/client.js'
import { bootstrapWorkspace } from '../src/services/pipelines/dailyContentEngine.js'
import { productionService } from '../src/production/ProductionService.js'
import { publishingService } from '../src/publishing/PublishingService.js'
import { productionPreflightService } from '../src/validation/ProductionPreflightService.js'
import { dryRunReportService } from '../src/validation/DryRunReportService.js'
import { experimentService } from '../src/validation/ExperimentService.js'
import { resolveUnknownOutcome } from '../src/validation/UnknownOutcomeResolver.js'
import {
  restoreSafetyDefaults,
  openPublishWindow,
  isSafetyDefaultState,
} from '../src/validation/SafetyDefaults.js'
import { buildServer } from '../src/server.js'
import { config } from '../src/config.js'

process.env.AUTOMATION_MODE = 'mock'
process.env.CWM_FAST_RETRY = '1'
process.env.CWM_CREDENTIALS_ENCRYPTION_KEY = 'phase5-test-encryption-key-32chars!!'
process.env.GLOBAL_PUBLISHING_KILL_SWITCH = 'true'
process.env.PUBLISHING_ENABLED = 'false'
process.env.YOUTUBE_PUBLISHING_ENABLED = 'false'
process.env.DRY_RUN = 'true'
process.env.MAX_PUBLICATIONS_PER_DAY = '1'

async function seedReady(workspaceId: string) {
  const db = getDb()
  const niche = db.prepare(`SELECT id FROM niches WHERE workspace_id=? LIMIT 1`).get(workspaceId) as {
    id: string
  }
  const topicId = uid()
  const ideaId = uid()
  const scriptId = uid()
  db.prepare(
    `INSERT INTO topics (id, workspace_id, niche_id, title, source_trace, opportunity_score, trend_score, gap_score, reality, created_at, fingerprint, score, score_breakdown)
     VALUES (?, ?, ?, 'P51 Topic', '[]', 0.8, 0.7, 0.6, 'MOCK', ?, ?, 80, '{}')`,
  ).run(topicId, workspaceId, niche.id, nowIso(), `fp-${topicId}`)
  db.prepare(
    `INSERT INTO content_ideas
     (id, workspace_id, topic_id, title, hooks, angles, formats, opportunity_score, status, reality, created_at)
     VALUES (?, ?, ?, 'P51 Idea', '[]', '[]', '[]', 0.9, 'selected', 'MOCK', ?)`,
  ).run(ideaId, workspaceId, topicId, nowIso())
  const body = {
    hook: 'Hook P51',
    setup: 'S',
    problem: 'P',
    insight: 'I',
    value: 'V',
    proof: 'Pr',
    cta: 'CTA',
  }
  db.prepare(
    `INSERT INTO scripts
     (id, workspace_id, idea_id, hook, body, cta, caption, hashtags, visual_brief,
      qa_status, qa_notes, reality, created_at, platform, status, quality_score, quality_breakdown, selected_hooks)
     VALUES (?, ?, ?, ?, ?, ?, 'c', '[]', ?, 'passed', '[]', 'MOCK', ?, 'YOUTUBE_SHORT', 'approved', 90, '{}', '[]')`,
  ).run(
    scriptId,
    workspaceId,
    ideaId,
    body.hook,
    JSON.stringify(body),
    body.cta,
    JSON.stringify({ durationSec: 2, shots: [{}, {}] }),
    nowIso(),
  )
  const prod = await productionService.run({
    workspaceId,
    scriptId,
    platform: 'YOUTUBE_SHORT',
    targetDurationOverride: 2,
  })
  const run = productionService.getRun(prod.productionRunId!) as { content_id: string }
  return run.content_id
}

describe('Phase 5.1 controlled production validation', () => {
  const tmp = path.join(os.tmpdir(), `cwm-p51-${Date.now()}.sqlite`)
  let workspaceId = ''
  let app: Awaited<ReturnType<typeof buildServer>>

  before(async () => {
    process.env.CWM_CREDENTIALS_ENCRYPTION_KEY = 'phase5-test-encryption-key-32chars!!'
    ;(config as { credentialsEncryptionKey: string }).credentialsEncryptionKey =
      process.env.CWM_CREDENTIALS_ENCRYPTION_KEY
    restoreSafetyDefaults()
    resetDbForTests(tmp)
    app = await buildServer()
    const boot = await bootstrapWorkspace({ name: 'P51', email: 'p51@cwm.test' })
    workspaceId = boot.workspaceId
  })

  it('ProductionPreflight returns READY/NOT_READY without secrets', async () => {
    const pf = await productionPreflightService.run({ workspaceId })
    assert.ok(pf.overall === 'READY' || pf.overall === 'NOT_READY')
    assert.equal(typeof pf.safe, 'boolean')
    assert.equal(typeof pf.readyToPublish, 'boolean')
    const blob = JSON.stringify(pf)
    assert.ok(!blob.includes('client_secret'))
    assert.ok(!blob.includes('access_token'))
    assert.ok(pf.checks.some((c) => c.id === 'database' && c.status === 'PASS'))
    assert.ok(pf.checks.some((c) => c.id === 'kill_switch'))
    // SAFE defaults → not ready to publish
    assert.equal(pf.readyToPublish, false)
    assert.equal(pf.safe, true)
  })

  it('safe defaults restore after open window', () => {
    const opened = openPublishWindow({ maxPublicationsPerDay: 1 })
    assert.equal(opened.flags.publishingEnabled, true)
    assert.equal(opened.flags.dryRun, false)
    const restored = restoreSafetyDefaults()
    assert.equal(restored.flags.globalPublishingKillSwitch, true)
    assert.equal(restored.flags.publishingEnabled, false)
    assert.equal(restored.flags.dryRun, true)
    assert.equal(isSafetyDefaultState(), true)
  })

  it('dry-run report never uploads and includes pre-publish fields', async () => {
    const contentId = await seedReady(workspaceId)
    const report = await dryRunReportService.build({
      workspaceId,
      contentId,
      platform: 'YOUTUBE_SHORT',
    })
    assert.equal(report.wouldUpload, false)
    assert.equal(report.reportType, 'YouTube Pre-Publish Report')
    assert.ok(report.title)
    assert.equal(report.contentId, contentId)
    assert.ok('durationSec' in report)
    assert.ok('thumbnail' in report)
    assert.ok('video' in report)
  })

  it('approval gate records approved_by and approved_at', async () => {
    const contentId = await seedReady(workspaceId)
    const res = await app.inject({
      method: 'POST',
      url: '/api/publishing/approve-for-publish',
      payload: { workspaceId, contentId, approvedBy: 'ops@nexus.test' },
    })
    assert.equal(res.statusCode, 200)
    const row = getDb()
      .prepare(
        `SELECT approved_for_publishing, approved_by, approved_for_publishing_at FROM contents WHERE id=?`,
      )
      .get(contentId) as {
      approved_for_publishing: number
      approved_by: string
      approved_for_publishing_at: string
    }
    assert.equal(row.approved_for_publishing, 1)
    assert.equal(row.approved_by, 'ops@nexus.test')
    assert.ok(row.approved_for_publishing_at)
  })

  it('experiment lifecycle: PLANNED → PREFLIGHT → DRY_RUN → APPROVED', async () => {
    const contentId = await seedReady(workspaceId)
    const created = experimentService.create({
      workspaceId,
      contentId,
      hypothesis: 'Hook A may improve retention',
      objective: 'prove real publishing + real analytics + real feedback',
    }) as { id: string; experiment_status: string }
    assert.equal(created.experiment_status, 'PLANNED')

    const pf = (await experimentService.runPreflight(created.id)) as {
      experiment_status: string
      preflight_report: string
    }
    assert.equal(pf.experiment_status, 'PREFLIGHT')
    assert.ok(pf.preflight_report)

    const dry = (await experimentService.runDryRun(created.id)) as {
      experiment_status: string
      dry_run_report: string
    }
    assert.equal(dry.experiment_status, 'DRY_RUN')
    const dryReport = JSON.parse(dry.dry_run_report) as { wouldUpload: boolean }
    assert.equal(dryReport.wouldUpload, false)

    const appr = experimentService.approve(created.id, 'ops@nexus.test') as {
      experiment_status: string
      approved_by: string
    }
    assert.equal(appr.experiment_status, 'APPROVED')
    assert.equal(appr.approved_by, 'ops@nexus.test')
  })

  it('mock publish tags publication_source MOCK (no silent REAL)', async () => {
    const contentId = await seedReady(workspaceId)
    const out = await publishingService.run({
      workspaceId,
      contentId,
      platform: 'YOUTUBE_SHORT',
    })
    assert.equal(out.status, 'PUBLISHED')
    const row = getDb()
      .prepare(`SELECT publication_source FROM publication_runs WHERE id=?`)
      .get(out.publicationRunId!) as { publication_source: string }
    assert.equal(row.publication_source, 'MOCK')
  })

  it('UNKNOWN outcome holds without auto-retry by default', () => {
    const hold = resolveUnknownOutcome({ remoteFound: false, autoRetryEnabled: false })
    assert.equal(hold.action, 'HOLD')
    const published = resolveUnknownOutcome({ remoteFound: true })
    assert.equal(published.action, 'MARK_PUBLISHED')
  })

  it('complete experiment restores safety defaults', async () => {
    openPublishWindow({ maxPublicationsPerDay: 1 })
    const contentId = await seedReady(workspaceId)
    const created = experimentService.create({ workspaceId, contentId }) as { id: string }
    const done = experimentService.complete(created.id, 'code-path validation only')
    assert.equal((done.experiment as { experiment_status: string }).experiment_status, 'COMPLETED')
    assert.equal(done.safety.flags.globalPublishingKillSwitch, true)
    assert.equal(done.safety.flags.publishingEnabled, false)
    assert.equal(done.safety.flags.dryRun, true)
  })

  it('validation API preflight never leaks tokens', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/validation/preflight?workspaceId=${workspaceId}`,
    })
    assert.equal(res.statusCode, 200)
    const body = JSON.stringify(res.json())
    assert.ok(!body.toLowerCase().includes('access_token'))
    assert.ok(!body.toLowerCase().includes('refresh_token'))
    assert.ok(body.includes('checks'))
  })

  it('open-window requires explicit confirmation and caps daily limit at 1', async () => {
    const bad = await app.inject({
      method: 'POST',
      url: '/api/validation/safety/open-window',
      payload: { confirm: 'nope' },
    })
    assert.equal(bad.statusCode, 400)
    const ok = await app.inject({
      method: 'POST',
      url: '/api/validation/safety/open-window',
      payload: { confirm: 'OPEN_PUBLISH_WINDOW', maxPublicationsPerDay: 1 },
    })
    assert.equal(ok.statusCode, 200)
    restoreSafetyDefaults()
  })
})
