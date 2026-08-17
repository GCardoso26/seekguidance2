import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import os from 'node:os'
import path from 'node:path'
import { resetDbForTests, getDb, uid, nowIso } from '../src/db/client.js'
import { buildServer } from '../src/server.js'
import {
  bootstrapWorkspace,
  getWorkspaceSnapshot,
  startWar,
} from '../src/services/pipelines/dailyContentEngine.js'
import { automationService } from '../src/services/AutomationService.js'

process.env.AUTOMATION_MODE = 'mock'
process.env.CWM_FAST_RETRY = '1'

describe('Phase 2 E2E research → idea → script + daily regression', () => {
  const tmp = path.join(os.tmpdir(), `cwm-p2-e2e-${Date.now()}.sqlite`)
  let app: Awaited<ReturnType<typeof buildServer>>
  let workspaceId = ''
  let nicheId = ''

  before(async () => {
    resetDbForTests(tmp)
    app = await buildServer()
    const boot = await bootstrapWorkspace({ name: 'P2 E2E', email: 'p2@cwm.test' })
    workspaceId = boot.workspaceId
    nicheId = boot.nicheId
  })

  it('API research run persists topics with score breakdown', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/research/run',
      payload: { workspaceId, nicheId, await: true },
    })
    assert.equal(res.statusCode, 200)
    const body = res.json()
    assert.ok(body.executionId)
    assert.ok(body.researchRunId || body.result)

    const topics = getDb()
      .prepare(`SELECT * FROM topics WHERE workspace_id = ? AND fingerprint IS NOT NULL`)
      .all(workspaceId) as Array<{ score: number; score_breakdown: string }>
    assert.ok(topics.length >= 1)
    assert.ok(topics[0].score > 0)
    assert.ok(JSON.parse(topics[0].score_breakdown).demand !== undefined)
  })

  it('API script generate from idea', async () => {
    const topic = getDb()
      .prepare(`SELECT id FROM topics WHERE workspace_id = ? LIMIT 1`)
      .get(workspaceId) as { id: string }
    const ideaId = uid()
    getDb()
      .prepare(
        `INSERT INTO content_ideas
         (id, workspace_id, topic_id, title, hooks, angles, formats, opportunity_score, status, reality, created_at)
         VALUES (?, ?, ?, ?, '[]', '["lista"]', '["short"]', 0.9, 'selected', 'MOCK', ?)`,
      )
      .run(ideaId, workspaceId, topic.id, 'Ideia E2E Script Factory', nowIso())

    const res = await app.inject({
      method: 'POST',
      url: '/api/scripts/generate',
      payload: {
        workspaceId,
        contentIdeaId: ideaId,
        platform: 'INSTAGRAM_REEL',
        await: true,
      },
    })
    assert.equal(res.statusCode, 200)
    const body = res.json()
    assert.equal(body.reality, 'MOCK')
    assert.ok(body.scriptRunId)
    assert.equal(body.result.hooks.length, 5)

    const run = await app.inject({ method: 'GET', url: `/api/scripts/runs/${body.scriptRunId}` })
    assert.equal(run.statusCode, 200)
    assert.equal(run.json().status, 'COMPLETED')
  })

  it('research and script endpoints enqueue without blocking by default', async () => {
    const topic = getDb()
      .prepare(`SELECT id FROM topics WHERE workspace_id = ? LIMIT 1`)
      .get(workspaceId) as { id: string }
    const ideaId = uid()
    getDb()
      .prepare(
        `INSERT INTO content_ideas
         (id, workspace_id, topic_id, title, hooks, angles, formats, opportunity_score, status, reality, created_at)
         VALUES (?, ?, ?, ?, '[]', '["lista"]', '["short"]', 0.9, 'selected', 'MOCK', ?)`,
      )
      .run(ideaId, workspaceId, topic.id, 'Ideia Async Queue', nowIso())

    const niche = getDb()
      .prepare(`SELECT id FROM niches WHERE workspace_id = ? LIMIT 1`)
      .get(workspaceId) as { id: string }

    const research = await app.inject({
      method: 'POST',
      url: '/api/research/run',
      payload: { workspaceId, nicheId: niche.id },
    })
    assert.equal(research.statusCode, 202)
    assert.equal(research.json().status, 'queued')
    assert.ok(research.json().executionId)

    const script = await app.inject({
      method: 'POST',
      url: '/api/scripts/generate',
      payload: { workspaceId, contentIdeaId: ideaId, platform: 'TIKTOK' },
    })
    assert.equal(script.statusCode, 202)
    assert.equal(script.json().status, 'queued')
    assert.ok(script.json().executionId)

    // allow background workers to finish
    await new Promise((r) => setTimeout(r, 50))
    const exec = automationService.getWorkflowStatus(script.json().executionId) as {
      status: string
    }
    assert.ok(['queued', 'running', 'completed', 'failed'].includes(exec.status))
  })

  it('daily engine regression still works', async () => {
    await startWar(workspaceId)
    const run = await automationService.triggerWorkflow('content_daily_pipeline', workspaceId, {
      phase2: true,
    })
    assert.equal(run.status, 'completed')
    const snap = getWorkspaceSnapshot(workspaceId)
    assert.ok((snap.contents as unknown[]).length >= 1)
    const published = (snap.contents as Array<{ status: string }>).filter((c) => c.status === 'published')
    assert.ok(published.length >= 1)
  })
})
