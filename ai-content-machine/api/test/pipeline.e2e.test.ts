import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { resetDbForTests } from '../src/db/client.js'
import { automationService } from '../src/services/AutomationService.js'
import {
  bootstrapWorkspace,
  getWorkspaceSnapshot,
  startWar,
} from '../src/services/pipelines/dailyContentEngine.js'
import { alreadyProcessed, markProcessed } from '../src/lib/idempotency.js'
import { signPayload, verifySignature } from '../src/lib/signature.js'
import { buildServer } from '../src/server.js'

process.env.AUTOMATION_MODE = 'mock'

describe('CWM mock acceptance pipeline', () => {
  const tmp = path.join(os.tmpdir(), `cwm-test-${Date.now()}.sqlite`)
  let app: Awaited<ReturnType<typeof buildServer>>

  before(async () => {
    resetDbForTests(tmp)
    app = await buildServer()
  })

  after(async () => {
    await app.close()
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp)
  })

  it('runs workspace → war → daily pipeline → winner → derivatives', async () => {
    const boot = await bootstrapWorkspace({ name: 'NEXUS War Lab', email: 'war@cwm.test' })
    assert.ok(boot.workspaceId)
    assert.equal(boot.channelIds.length, 3)

    const war = await startWar(boot.workspaceId)
    assert.ok(war.warId)

    const run = await automationService.triggerWorkflow(
      'content_daily_pipeline',
      boot.workspaceId,
      { test: true },
    )
    assert.equal(run.status, 'completed')
    assert.equal(run.reality, 'MOCK')

    const snap = getWorkspaceSnapshot(boot.workspaceId)
    assert.ok((snap.topics as unknown[]).length >= 3, 'topics persisted')
    assert.ok((snap.ideas as unknown[]).length >= 1, 'ideas persisted')
    assert.ok((snap.scripts as unknown[]).length >= 1, 'scripts persisted')
    assert.ok((snap.contents as unknown[]).length >= 1, 'contents persisted')

    const published = (snap.contents as Array<{ status: string; reality: string }>).filter(
      (c) => c.status === 'published',
    )
    assert.ok(published.length >= 1, 'mock publish happened')
    assert.ok(published.every((c) => c.reality === 'MOCK'), 'published reality is MOCK not REAL')

    assert.ok((snap.metrics as unknown[]).length >= 1, 'metrics mock persisted')

    const events = snap.events as Array<{ event_type: string }>
    const types = new Set(events.map((e) => e.event_type))
    for (const required of [
      'topic.created',
      'idea.created',
      'script.created',
      'content.created',
      'content.published',
      'metrics.updated',
    ]) {
      assert.ok(types.has(required), `missing event ${required}`)
    }

    const winners = (snap.contents as Array<{ performance_class: string | null }>).filter(
      (c) => c.performance_class === 'WINNER',
    )
    assert.ok(winners.length >= 1, 'winner detected')
    assert.ok(types.has('content.winner_detected'))
    const derived = (snap.ideas as Array<{ derivation_type: string | null; parent_content_id: string | null }>).filter(
      (i) => i.derivation_type && i.parent_content_id,
    )
    assert.ok(derived.length >= 10, 'at least 10 derivatives with parentContentId')

    assert.ok(snap.war, 'war campaign exists')
  })

  it('is idempotent for same daily event', async () => {
    const boot = await bootstrapWorkspace({ name: 'Idem Lab', email: 'idem@cwm.test' })
    await startWar(boot.workspaceId)
    const first = await automationService.triggerWorkflow('content_daily_pipeline', boot.workspaceId)
    const second = await automationService.triggerWorkflow('content_daily_pipeline', boot.workspaceId)
    assert.equal(first.status, 'completed')
    assert.equal(second.status, 'completed')
    assert.equal((second.result as { skipped?: boolean }).skipped, true)
  })

  it('idempotency helper skips processed events', () => {
    const id = `evt-${Date.now()}`
    assert.equal(alreadyProcessed(id), false)
    markProcessed({ eventId: id, workflow: 'test' })
    assert.equal(alreadyProcessed(id), true)
  })

  it('rejects unsigned webhooks', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/webhooks/n8n',
      payload: { event: 'content.published', timestamp: Math.floor(Date.now() / 1000), payload: {} },
    })
    assert.equal(res.statusCode, 401)
  })

  it('accepts signed webhooks', async () => {
    const timestamp = Math.floor(Date.now() / 1000)
    const payload = { workspaceId: crypto.randomUUID(), reality: 'MOCK', eventId: `wh-${timestamp}` }
    const raw = JSON.stringify({ event: 'metrics.updated', timestamp, payload })
    const signature = signPayload(timestamp, raw)
    assert.equal(verifySignature(signature, timestamp, raw).ok, true)

    const res = await app.inject({
      method: 'POST',
      url: '/api/webhooks/n8n',
      payload: { signature, event: 'metrics.updated', timestamp, payload },
    })
    assert.equal(res.statusCode, 200)
    assert.equal(res.json().ok, true)
  })

  it('exposes prompt versions without hardcoding in workflows', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/ai/prompts/script_generator' })
    assert.equal(res.statusCode, 200)
    assert.ok(res.json().body.includes('HOOK'))
  })

  it('automation trigger API works', async () => {
    const boot = await bootstrapWorkspace({ name: 'API Lab', email: 'api@cwm.test' })
    const res = await app.inject({
      method: 'POST',
      url: '/api/automation/trigger',
      payload: { workflow: 'research_engine', workspaceId: boot.workspaceId, payload: {} },
    })
    assert.equal(res.statusCode, 200)
    assert.equal(res.json().reality, 'MOCK')
  })
})
