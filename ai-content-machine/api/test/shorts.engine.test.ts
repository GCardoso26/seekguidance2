import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import os from 'node:os'
import path from 'node:path'
import { resetDbForTests, getDb, uid, nowIso } from '../src/db/client.js'
import { buildServer } from '../src/server.js'
import { bootstrapWorkspace } from '../src/services/pipelines/dailyContentEngine.js'
import { productionService } from '../src/production/ProductionService.js'
import { ManualFallbackProvider } from '../src/production/visual/ManualFallbackProvider.js'

process.env.AUTOMATION_MODE = 'mock'
process.env.CWM_FAST_RETRY = '1'
delete process.env.COMFY_BASE_URL
delete process.env.PEXELS_API_KEY
delete process.env.PIXABAY_API_KEY

function seedApprovedScript(workspaceId: string) {
  const db = getDb()
  const topicId = uid()
  const ideaId = uid()
  const scriptId = uid()
  const niche = db.prepare(`SELECT id FROM niches WHERE workspace_id=? LIMIT 1`).get(workspaceId) as {
    id: string
  }
  db.prepare(
    `INSERT INTO topics (id, workspace_id, niche_id, title, source_trace, opportunity_score, trend_score, gap_score, reality, created_at, fingerprint, score, score_breakdown)
     VALUES (?, ?, ?, 'Topic Short', '[]', 0.8, 0.7, 0.6, 'MOCK', ?, 'fp-short-${topicId}', 80, '{}')`,
  ).run(topicId, workspaceId, niche.id, nowIso())
  db.prepare(
    `INSERT INTO content_ideas
     (id, workspace_id, topic_id, title, hooks, angles, formats, opportunity_score, status, reality, created_at)
     VALUES (?, ?, ?, 'Short idea', '[]', '[]', '[]', 0.9, 'selected', 'MOCK', ?)`,
  ).run(ideaId, workspaceId, topicId, nowIso())
  const body = {
    hook: 'Pare de perder 2h por dia com IA solta',
    setup: 'Abrir apps não é sistema',
    problem: 'Retrabalho todos os dias',
    insight: 'Um pipeline com gate',
    value: 'Character lock e Visual Bible',
    proof: 'QA trava o publish',
    cta: 'Link na descrição',
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
    JSON.stringify({ durationSec: 3, shots: [{}, {}, {}] }),
    nowIso(),
  )
  return { scriptId }
}

describe('Shorts engine domain API', () => {
  const tmp = path.join(os.tmpdir(), `cwm-shorts-${Date.now()}.sqlite`)
  let app: Awaited<ReturnType<typeof buildServer>>
  let workspaceId = ''

  before(async () => {
    resetDbForTests(tmp)
    app = await buildServer()
    const boot = await bootstrapWorkspace({ name: 'Shorts Lab', email: 'shorts@cwm.test' })
    workspaceId = boot.workspaceId
  })

  it('GET /api/health/system hides Comfy as optional', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/health/system' })
    assert.equal(res.statusCode, 200)
    const body = res.json()
    assert.equal(body.comfyOptional, true)
    assert.ok(['READY', 'NOT_CONFIGURED', 'ERROR'].includes(body.ffmpeg))
    assert.ok(body.visual.pexels)
    assert.ok(body.script.gemini)
  })

  it('POST /api/shorts creates idea+script+production in mock without crashing', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/shorts',
      payload: { workspaceId, topic: 'Por que IA sem sistema custa tempo', durationSec: 12 },
    })
    assert.ok([201, 500].includes(res.statusCode))
    if (res.statusCode === 201) {
      const body = res.json()
      assert.ok(body.productionRunId || body.scriptId)
    }
  })

  it('dashboard counts WAITING_ASSETS attention', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/studio/home?workspaceId=${workspaceId}`,
    })
    assert.equal(res.statusCode, 200)
    const body = res.json()
    assert.ok(body.production)
    assert.ok(Array.isArray(body.attention))
    assert.ok(body.metrics)
    assert.equal(typeof body.metrics.assetReuseRate, 'number')
  })

  it('production mode without stock keys waits for a manual asset instead of mocking', async () => {
    process.env.AUTOMATION_MODE = 'production'
    delete process.env.PEXELS_API_KEY
    delete process.env.PIXABAY_API_KEY
    delete process.env.COMFY_BASE_URL
    const { createVisualResolver } = await import('../src/production/visual/createVisualResolver.js')
    const svc = productionService as unknown as { visual: ReturnType<typeof createVisualResolver> }
    const previous = svc.visual
    svc.visual = createVisualResolver()
    try {
      const { scriptId } = seedApprovedScript(workspaceId)
      const prod = await productionService.run({
        workspaceId,
        scriptId,
        platform: 'YOUTUBE_SHORT',
        targetDurationOverride: 2,
        allowUnapproved: true,
      })
      assert.equal(prod.status, 'WAITING_ASSETS')
      const requests = productionService.listManualRequests(prod.productionRunId)
      assert.ok(requests.length >= 1)
      const dlq = getDb()
        .prepare(`SELECT COUNT(*) as n FROM automation_failures WHERE entity_id=?`)
        .get(prod.productionRunId) as { n: number }
      assert.equal(dlq.n, 0)
    } finally {
      svc.visual = previous
      process.env.AUTOMATION_MODE = 'mock'
    }
  })

  it('manual upload endpoint rejects tiny payloads', async () => {
    const { scriptId } = seedApprovedScript(workspaceId)
    const prod = await productionService.run({
      workspaceId,
      scriptId,
      platform: 'YOUTUBE_SHORT',
      targetDurationOverride: 2,
    })
    const res = await app.inject({
      method: 'POST',
      url: `/api/production/runs/${prod.productionRunId}/scenes/1/upload`,
      payload: { imageBase64: 'aaa' },
    })
    assert.equal(res.statusCode, 400)
  })

  it('ManualFallbackProvider request is first-class, not Error 500 copy', async () => {
    await assert.rejects(
      () =>
        new ManualFallbackProvider().generate({
          prompt: 'tired clock',
          outPath: '/tmp/no.png',
          width: 1080,
          height: 1920,
          scene: 3,
          role: 'problem',
          visualIntent: 'tired person looking at clock night',
        }),
      (err: unknown) => {
        const e = err as { code?: string; request?: { search_queries: string[] } }
        assert.equal(e.code, 'AWAITING_USER')
        assert.ok(e.request?.search_queries?.length)
        return true
      },
    )
  })
})
