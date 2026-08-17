import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { resetDbForTests, getDb, uid, nowIso } from '../src/db/client.js'
import { bootstrapWorkspace } from '../src/services/pipelines/dailyContentEngine.js'
import { researchService } from '../src/research/ResearchService.js'
import { MockResearchProvider } from '../src/research/providers/MockResearchProvider.js'
import {
  AlwaysFailResearchProvider,
  FlakyResearchProvider,
} from '../src/research/providers/stubs.js'
import { dedupeResults } from '../src/research/Deduplicator.js'
import { normalizeResults } from '../src/research/Normalizer.js'
import type { ResearchResult } from '../src/research/types.js'

process.env.AUTOMATION_MODE = 'mock'
process.env.CWM_FAST_RETRY = '1'

describe('Research Engine', () => {
  const tmp = path.join(os.tmpdir(), `cwm-research-${Date.now()}.sqlite`)
  let workspaceId = ''
  let nicheId = ''

  before(async () => {
    resetDbForTests(tmp)
    const boot = await bootstrapWorkspace({ name: 'Research Lab', email: 'research@cwm.test' })
    workspaceId = boot.workspaceId
    nicheId = boot.nicheId
  })

  it('normalizes 10 provider results into topics', async () => {
    const result = await researchService.run({
      workspaceId,
      nicheId,
      testProviders: [new MockResearchProvider()],
    })
    assert.equal(result.skipped, false)
    if (result.skipped) return
    assert.ok((result.itemsFound ?? 0) >= 10)
    assert.ok(result.topicsCreated.length >= 1)
    assert.ok(['COMPLETED', 'PARTIAL'].includes(result.status))
  })

  it('deduplicates identical results', () => {
    const base: ResearchResult = {
      provider: 'mock',
      sourceType: 'search',
      sourceUrl: 'mock://same',
      sourceTitle: 'Mesmo Título',
      title: 'Mesmo Título',
      description: 'x',
      keywords: ['ia'],
      reality: 'MOCK',
    }
    const normalized = normalizeResults([base, { ...base }, { ...base, title: 'mesmo titulo' }])
    const deduped = dedupeResults(normalized, nicheId)
    assert.equal(deduped.length, 1)
  })

  it('retries flaky provider then succeeds', async () => {
    // unique niche to avoid idempotency collision with previous run
    const nid = uid()
    getDb()
      .prepare(
        `INSERT INTO niches (id, workspace_id, name, promise, keywords, active, created_at)
         VALUES (?, ?, 'Flaky Niche', '', '[]', 1, ?)`,
      )
      .run(nid, workspaceId, nowIso())

    const provider = new FlakyResearchProvider(2, [
      {
        provider: 'flaky',
        sourceType: 'search',
        sourceUrl: 'mock://flaky/1',
        sourceTitle: 'Flaky ok',
        title: 'Flaky ok',
        description: 'recovered',
        keywords: ['ia'],
        engagement: { score: 0.7, views: 1000 },
        reality: 'MOCK',
      },
    ])
    const result = await researchService.run({
      workspaceId,
      nicheId: nid,
      testProviders: [provider],
    })
    assert.equal(result.skipped, false)
    if (result.skipped) return
    assert.equal(result.status, 'COMPLETED')
    assert.ok(result.topicsCreated.length >= 1)
  })

  it('sends to DLQ after 3 failures', async () => {
    const nid = uid()
    getDb()
      .prepare(
        `INSERT INTO niches (id, workspace_id, name, promise, keywords, active, created_at)
         VALUES (?, ?, 'Fail Niche', '', '[]', 1, ?)`,
      )
      .run(nid, workspaceId, nowIso())

    const result = await researchService.run({
      workspaceId,
      nicheId: nid,
      testProviders: [new AlwaysFailResearchProvider()],
    })
    assert.equal(result.status, 'FAILED')
    const dlq = getDb()
      .prepare(
        `SELECT * FROM automation_failures WHERE workflow='research_engine' ORDER BY created_at DESC LIMIT 1`,
      )
      .get() as { attempts: number; status: string }
    assert.equal(dlq.attempts, 3)
    assert.equal(dlq.status, 'open')
  })

  it('returns PARTIAL when one provider fails and another succeeds', async () => {
    const nid = uid()
    getDb()
      .prepare(
        `INSERT INTO niches (id, workspace_id, name, promise, keywords, active, created_at)
         VALUES (?, ?, 'Partial Niche', '', '["ia"]', 1, ?)`,
      )
      .run(nid, workspaceId, nowIso())

    const result = await researchService.run({
      workspaceId,
      nicheId: nid,
      testProviders: [new AlwaysFailResearchProvider(), new MockResearchProvider()],
    })
    assert.equal(result.skipped, false)
    if (result.skipped) return
    assert.equal(result.status, 'PARTIAL')
    assert.ok(result.topicsCreated.length >= 1)
  })

  it('is idempotent on second successful run', async () => {
    const nid = uid()
    getDb()
      .prepare(
        `INSERT INTO niches (id, workspace_id, name, promise, keywords, active, created_at)
         VALUES (?, ?, 'Idem Niche', '', '[]', 1, ?)`,
      )
      .run(nid, workspaceId, nowIso())

    const first = await researchService.run({
      workspaceId,
      nicheId: nid,
      testProviders: [new MockResearchProvider()],
    })
    const second = await researchService.run({
      workspaceId,
      nicheId: nid,
      testProviders: [new MockResearchProvider()],
    })
    assert.equal(first.skipped, false)
    assert.equal(second.skipped, true)
  })
})

// cleanup hint
void fs
