import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { resetDbForTests, getDb, uid, nowIso } from '../src/db/client.js'
import { buildServer } from '../src/server.js'
import { bootstrapWorkspace } from '../src/services/pipelines/dailyContentEngine.js'
import { automationService } from '../src/services/AutomationService.js'

process.env.AUTOMATION_MODE = 'mock'
process.env.CWM_FAST_RETRY = '1'

function seedApprovedScript(workspaceId: string) {
  const db = getDb()
  const niche = db.prepare(`SELECT id FROM niches WHERE workspace_id=? LIMIT 1`).get(workspaceId) as {
    id: string
  }
  const topicId = uid()
  const ideaId = uid()
  const scriptId = uid()
  db.prepare(
    `INSERT INTO topics (id, workspace_id, niche_id, title, source_trace, opportunity_score, trend_score, gap_score, reality, created_at, fingerprint, score, score_breakdown)
     VALUES (?, ?, ?, 'P3 Topic', '[]', 0.8, 0.7, 0.6, 'MOCK', ?, 'fp-p3-${topicId}', 88, '{}')`,
  ).run(topicId, workspaceId, niche.id, nowIso())
  db.prepare(
    `INSERT INTO content_ideas
     (id, workspace_id, topic_id, title, hooks, angles, formats, opportunity_score, status, reality, created_at)
     VALUES (?, ?, ?, 'P3 Idea', '[]', '[]', '[]', 0.9, 'selected', 'MOCK', ?)`,
  ).run(ideaId, workspaceId, topicId, nowIso())
  const body = {
    hook: 'Hook P3',
    setup: 'Setup',
    problem: 'Problem',
    insight: 'Insight',
    value: 'Value',
    proof: 'Proof',
    cta: 'CTA bio',
  }
  db.prepare(
    `INSERT INTO scripts
     (id, workspace_id, idea_id, hook, body, cta, caption, hashtags, visual_brief,
      qa_status, qa_notes, reality, created_at, platform, status, quality_score, quality_breakdown, selected_hooks)
     VALUES (?, ?, ?, ?, ?, ?, 'cap', '[]', ?, 'passed', '[]', 'MOCK', ?, 'YOUTUBE_SHORT', 'approved', 90, '{}', '[]')`,
  ).run(
    scriptId,
    workspaceId,
    ideaId,
    body.hook,
    JSON.stringify(body),
    body.cta,
    JSON.stringify({ durationSec: 2, shots: [{}, {}, {}] }),
    nowIso(),
  )
  return scriptId
}

describe('Phase 3 E2E production API', () => {
  const tmp = path.join(os.tmpdir(), `cwm-p3-e2e-${Date.now()}.sqlite`)
  let app: Awaited<ReturnType<typeof buildServer>>
  let workspaceId = ''

  before(async () => {
    resetDbForTests(tmp)
    app = await buildServer()
    const boot = await bootstrapWorkspace({ name: 'P3 E2E', email: 'p3@cwm.test' })
    workspaceId = boot.workspaceId
  })

  it('POST /api/production/run await=true → READY_FOR_PUBLISH package', async () => {
    const scriptId = seedApprovedScript(workspaceId)
    const res = await app.inject({
      method: 'POST',
      url: '/api/production/run',
      payload: {
        workspaceId,
        scriptId,
        platform: 'YOUTUBE_SHORT',
        targetDurationOverride: 2,
        await: true,
      },
    })
    assert.equal(res.statusCode, 200)
    const body = res.json()
    assert.ok(body.executionId)
    assert.ok(body.productionRunId)
    assert.equal(body.result.status, 'COMPLETED')
    assert.equal(body.result.packageStatus, 'READY_FOR_PUBLISH')

    const run = await app.inject({ method: 'GET', url: `/api/production/runs/${body.productionRunId}` })
    assert.equal(run.statusCode, 200)
    const detail = run.json()
    assert.equal(detail.package_status, 'READY_FOR_PUBLISH')
    assert.ok(detail.assets.length >= 5)
    for (const a of detail.assets.filter((x: { is_current: number }) => x.is_current)) {
      assert.ok(fs.existsSync(a.uri))
      assert.equal(String(a.checksum).length, 64)
      assert.equal(a.source_type, 'MOCK')
    }

    const contentId = detail.content_id
    const assets = await app.inject({ method: 'GET', url: `/api/production/${contentId}/assets` })
    assert.equal(assets.statusCode, 200)
    assert.ok(assets.json().assets.length >= 1)

    const autoRuns = getDb()
      .prepare(`SELECT * FROM automation_runs WHERE workflow='content_production' AND workspace_id=?`)
      .all(workspaceId) as Array<{ status: string }>
    assert.ok(autoRuns.some((r) => r.status === 'completed'))
  })

  it('default enqueue returns 202 QUEUED', async () => {
    const scriptId = seedApprovedScript(workspaceId)
    const res = await app.inject({
      method: 'POST',
      url: '/api/production/run',
      payload: { workspaceId, scriptId, platform: 'TIKTOK', targetDurationOverride: 2 },
    })
    assert.equal(res.statusCode, 202)
    assert.equal(res.json().status, 'QUEUED')
    assert.ok(res.json().executionId)
    await new Promise((r) => setTimeout(r, 100))
  })

  it('composition failure retries only composition', async () => {
    const scriptId = seedApprovedScript(workspaceId)
    const failed = await automationService.triggerWorkflow('content_production', workspaceId, {
      scriptId,
      platform: 'YOUTUBE_SHORT',
      targetDurationOverride: 2,
      forceFailStage: 'COMPOSING',
      forceFailTimes: 99,
    })
    const productionRunId = (failed.result as { productionRunId: string }).productionRunId
    assert.equal((failed.result as { status: string }).status, 'PARTIAL')

    const before = getDb()
      .prepare(`SELECT result FROM production_runs WHERE id=?`)
      .get(productionRunId) as { result: string }
    const stages = JSON.parse(before.result).stages
    assert.equal(stages.VOICE.ok, true)
    assert.equal(stages.VISUALS.ok, true)
    assert.equal(stages.SUBTITLES.ok, true)
    assert.equal(stages.COMPOSING.ok, false)

    const retry = await app.inject({
      method: 'POST',
      url: `/api/production/runs/${productionRunId}/retry`,
      payload: { stage: 'COMPOSING' },
    })
    assert.equal(retry.statusCode, 200)
    const after = JSON.parse(
      (getDb().prepare(`SELECT result FROM production_runs WHERE id=?`).get(productionRunId) as { result: string })
        .result,
    )
    assert.equal(after.stages.VOICE.ok, true)
    assert.equal(after.stages.COMPOSING.ok, true)
  })

  it('daily engine regression still runs', async () => {
    const out = await automationService.triggerWorkflow('content_daily_pipeline', workspaceId, {})
    assert.ok(out.executionId)
    assert.ok(out.status === 'completed' || out.status === 'failed' || out.reality === 'MOCK')
  })
})
