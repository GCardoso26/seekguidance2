import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { resetDbForTests, getDb, uid, nowIso } from '../src/db/client.js'
import { buildServer } from '../src/server.js'

process.env.AUTOMATION_MODE = 'mock'
process.env.CWM_FAST_RETRY = '1'

/**
 * Operator critical path, exercised over HTTP exactly like AutomationCenter.tsx does:
 *
 *   Idea → Script (YOUTUBE_SHORT) → Approve → Production (no allowUnapproved)
 *   → READY_FOR_PUBLISH → Dry-run → Approve-for-publish
 *
 * No ComfyUI, no Ollama, no Kokoro: every external engine is off, so the run must
 * still land on READY_FOR_PUBLISH through the Mock fallbacks.
 */

function clearExternalProviders() {
  delete process.env.OLLAMA_BASE_URL
  delete process.env.OPENAI_API_KEY
  delete process.env.SCRIPT_LLM_API_KEY
  delete process.env.KOKORO_BASE_URL
  delete process.env.VOICE_API_KEY
  delete process.env.ELEVENLABS_API_KEY
  delete process.env.COMFY_BASE_URL
}

type Injected = Awaited<ReturnType<typeof buildServer>>

/** Mirrors AutomationCenter's isApprovedScript — production must accept exactly these. */
function isApprovedScript(s: { status: string; qa_status: string }): boolean {
  return s.status === 'approved' || (s.status === 'ready' && s.qa_status === 'passed')
}

describe('Operator critical path — Idea → Script → Approve → Production → publish gate', () => {
  const tmp = path.join(os.tmpdir(), `cwm-operator-path-${Date.now()}.sqlite`)
  let app: Injected
  let workspaceId = ''

  before(async () => {
    clearExternalProviders()
    resetDbForTests(tmp)
    app = await buildServer()
  })

  after(async () => {
    clearExternalProviders()
    await app?.close()
  })

  it('step 0 — POST /api/workspaces returns a usable workspaceId (Create Workspace button)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/workspaces',
      payload: { name: 'Operator Path', email: `operator+${Date.now()}@cwm.test` },
    })
    assert.equal(res.statusCode, 200)
    workspaceId = res.json().workspaceId
    // The UI only accepts a v1-v5 UUID (isWorkspaceId) before it will call anything else.
    assert.match(
      workspaceId,
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    )
  })

  it('step 1 — GET /api/factory/status matches the UI FactoryStatus contract', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/factory/status' })
    assert.equal(res.statusCode, 200)
    const body = res.json()

    // Exactly the fields AutomationCenter renders in the "Fábrica real" strip.
    assert.equal(typeof body.script.ollama, 'string')
    assert.equal(typeof body.script.api, 'string')
    assert.equal(typeof body.script.mock, 'string')
    assert.equal(typeof body.script.status, 'string')
    assert.equal(typeof body.voice.kokoro, 'string')
    assert.equal(typeof body.voice.resolver, 'string')
    assert.equal(typeof body.visual.status, 'string')
    assert.equal(typeof body.composition.ffmpeg_kenburns, 'string')
    assert.equal(typeof body.ffmpeg, 'string')
    assert.ok(body.thumbnail && body.storage)

    // Without ComfyUI/Ollama/Kokoro the strip must say NOT_CONFIGURED, never crash.
    assert.equal(body.script.ollama, 'NOT_CONFIGURED')
    assert.equal(body.voice.kokoro, 'NOT_CONFIGURED')
    assert.equal(body.visual.comfy, 'NOT_CONFIGURED')
    // ffmpeg is the one engine that must actually be present for the factory to work.
    assert.equal(body.composition.ffmpeg_kenburns, 'READY')
  })

  it('step 2 — POST /api/ideas creates the idea ("Nova idea rápida") and it shows up in the dropdown', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/api/ideas',
      payload: { workspaceId, title: 'Fábrica local de Shorts sem GPU' },
    })
    assert.equal(created.statusCode, 201)
    const ideaId = created.json().id
    assert.ok(ideaId)

    const listed = await app.inject({ method: 'GET', url: `/api/ideas/workspaces/${workspaceId}` })
    assert.equal(listed.statusCode, 200)
    const ideas = listed.json().ideas as Array<{ id: string; title: string; status: string }>
    const mine = ideas.find((i) => i.id === ideaId)
    assert.ok(mine, 'idea must be listed by the endpoint the UI reads')
    assert.equal(mine!.status, 'selected')
    // The UI renders `[{status}] {title}` — both fields must be present.
    assert.equal(typeof mine!.title, 'string')
  })

  it('step 3 — full path: script → approve → production → READY_FOR_PUBLISH (no allowUnapproved)', async () => {
    const ideaRes = await app.inject({
      method: 'POST',
      url: '/api/ideas',
      payload: { workspaceId, title: 'Caminho crítico do operador' },
    })
    const ideaId = ideaRes.json().id as string

    // --- Run Script Factory (YOUTUBE_SHORT) ---
    const scriptRes = await app.inject({
      method: 'POST',
      url: '/api/scripts/generate',
      payload: { workspaceId, contentIdeaId: ideaId, platform: 'YOUTUBE_SHORT', await: true },
    })
    assert.equal(scriptRes.statusCode, 200)
    const scriptBody = scriptRes.json()
    assert.equal(scriptBody.result.skipped, false)
    const scriptId = scriptBody.result.scriptId as string
    assert.ok(scriptId)
    assert.equal(scriptBody.result.platform ?? 'YOUTUBE_SHORT', 'YOUTUBE_SHORT')

    const scriptRunRow = getDb()
      .prepare(`SELECT platform, provider FROM script_runs WHERE id=?`)
      .get(scriptBody.result.scriptRunId) as { platform: string; provider: string }
    assert.equal(scriptRunRow.platform, 'YOUTUBE_SHORT')
    // Ollama is off — the resolver must have degraded to mock rather than failing.
    assert.equal(scriptRunRow.provider, 'mock')

    // --- Snapshot must expose what the UI's script dropdown needs ---
    const snapRes = await app.inject({ method: 'GET', url: `/api/workspaces/${workspaceId}` })
    const snapScripts = snapRes.json().scripts as Array<{
      id: string
      status: string
      qa_status: string
      platform: string
      hook: string
    }>
    const mine = snapScripts.find((s) => s.id === scriptId)
    assert.ok(mine)
    assert.equal(mine!.platform, 'YOUTUBE_SHORT')
    assert.equal(typeof mine!.status, 'string')
    assert.equal(typeof mine!.qa_status, 'string')

    // --- Approve Script ---
    const approveRes = await app.inject({
      method: 'POST',
      url: `/api/scripts/${scriptId}/approve`,
      payload: { workspaceId },
    })
    assert.equal(approveRes.statusCode, 200)
    assert.equal(approveRes.json().status, 'approved')

    const approved = getDb()
      .prepare(`SELECT status, qa_status FROM scripts WHERE id=?`)
      .get(scriptId) as { status: string; qa_status: string }
    assert.ok(isApprovedScript(approved))

    // --- Run Production (YOUTUBE_SHORT), no allowUnapproved, no regenerate ---
    const prodRes = await app.inject({
      method: 'POST',
      url: '/api/production/run',
      payload: { workspaceId, scriptId, platform: 'YOUTUBE_SHORT', regenerate: false, await: true },
    })
    assert.equal(prodRes.statusCode, 200)
    const prod = prodRes.json()
    assert.equal(prod.result.skipped, false)
    assert.equal(prod.result.status, 'COMPLETED')
    assert.equal(
      prod.result.packageStatus,
      'READY_FOR_PUBLISH',
      `expected READY_FOR_PUBLISH, got ${prod.result.packageStatus}: ${JSON.stringify(prod.result.result?.qa || {})}`,
    )
    const productionRunId = prod.productionRunId as string
    assert.ok(productionRunId)

    // --- Providers must be visible in the result (UI observability line) ---
    const stages = prod.result.result.stages as Record<
      string,
      {
        ok: boolean
        provider?: string
        fallbackTrail?: Array<{ provider: string; status: string }>
        library?: { hits: number; misses: number }
      }
    >
    assert.equal(stages.VOICE.provider, 'mock_voice')
    assert.equal(stages.VISUALS.ok, true)
    assert.equal(stages.COMPOSING.provider, 'ffmpeg_kenburns')
    assert.ok(stages.VISUALS.library, 'library hits/misses must be reported')

    // Fresh workspace: every scene is a library MISS, and with ComfyUI absent the
    // visual chain must degrade to Mock rather than stalling the run.
    assert.ok((stages.VISUALS.library!.misses ?? 0) >= 1, 'expected library MISS on a first run')
    assert.equal(stages.VISUALS.provider, 'mock_visual')
    assert.ok(
      stages.VISUALS.fallbackTrail?.some(
        (t) => t.provider === 'comfyui' && t.status === 'NOT_CONFIGURED',
      ),
      'the skipped ComfyUI attempt must be recorded in the fallback trail',
    )
    const fm = prod.result.result.factoryMetrics as {
      voiceProvider: string
      composeProvider: string
      visualProvider: string
      packageStatus: string
    }
    assert.ok(fm, 'factoryMetrics must be present for the UI summary')
    assert.equal(fm.composeProvider, 'ffmpeg_kenburns')
    assert.equal(fm.packageStatus, 'READY_FOR_PUBLISH')

    // --- Platform is YOUTUBE_SHORT end to end, and TIKTOK appears nowhere ---
    const runRow = getDb()
      .prepare(`SELECT plan, content_id, package_status FROM production_runs WHERE id=?`)
      .get(productionRunId) as { plan: string; content_id: string; package_status: string }
    assert.equal(JSON.parse(runRow.plan).platform, 'YOUTUBE_SHORT')
    assert.equal(runRow.package_status, 'READY_FOR_PUBLISH')

    const pkgRow = getDb()
      .prepare(`SELECT status, manifest FROM content_packages WHERE production_id=?`)
      .get(productionRunId) as { status: string; manifest: string }
    assert.equal(pkgRow.status, 'READY_FOR_PUBLISH')
    assert.equal(JSON.parse(pkgRow.manifest).platform, 'YOUTUBE_SHORT')
    assert.equal(
      /TIKTOK/i.test(pkgRow.manifest),
      false,
      'a YouTube Short package must not mention TIKTOK anywhere',
    )

    // --- The MP4 actually exists and is playable ---
    const detailRes = await app.inject({
      method: 'GET',
      url: `/api/production/runs/${productionRunId}`,
    })
    assert.equal(detailRes.statusCode, 200)
    const detail = detailRes.json()
    assert.ok(detail.providers, 'run detail must carry providers for the UI detail panel')
    assert.equal(detail.providers.composition.ffmpeg_kenburns, 'READY')
    const final = (detail.assets as Array<{ type: string; uri: string; is_current: number }>).find(
      (a) => a.type === 'FINAL_VIDEO' && a.is_current === 1,
    )
    assert.ok(final && fs.existsSync(final.uri))
    assert.ok(fs.statSync(final.uri).size > 1000)

    // No asset may carry an UNKNOWN license — that silently forces REQUIRES_REVIEW.
    const unknown = (detail.assets as Array<{ license: string; is_current: number }>).filter(
      (a) => a.is_current === 1 && (!a.license || a.license === 'UNKNOWN'),
    )
    assert.equal(unknown.length, 0, 'no current asset may have an UNKNOWN license')

    // --- "Usar último READY_FOR_PUBLISH" needs content_id on the runs list ---
    const runsRes = await app.inject({
      method: 'GET',
      url: `/api/production/workspaces/${workspaceId}/runs`,
    })
    const runs = runsRes.json().runs as Array<{ id: string; package_status: string; content_id: string }>
    const ready = runs.find((r) => r.package_status === 'READY_FOR_PUBLISH')
    assert.ok(ready?.content_id, 'the UI resolves the publish contentId from this field')
    const contentId = ready!.content_id

    // --- Dry-run report ---
    const dryRes = await app.inject({
      method: 'POST',
      url: '/api/validation/dry-run-report',
      payload: { workspaceId, contentId, platform: 'YOUTUBE_SHORT' },
    })
    assert.equal(dryRes.statusCode, 200)
    const dry = dryRes.json()
    assert.equal(dry.wouldUpload, false)
    assert.equal(dry.platform, 'YOUTUBE_SHORT')
    // The media package itself must be flawless. The only blocker allowed here is the
    // YouTube OAuth connection, which no test environment has (and which correctly
    // keeps the UI's "Publish REAL" button disabled).
    assert.equal(dry.packageOk, true, `package not ok: ${JSON.stringify(dry.validation)}`)
    const blockers = (dry.validation.issues as string[]).filter((i) => i !== 'youtube_not_connected')
    assert.deepEqual(
      blockers,
      [],
      `only the OAuth connection may block the dry-run: ${JSON.stringify(dry.validation.issues)}`,
    )

    // --- Approve for publish (no SQL hack required) ---
    const apRes = await app.inject({
      method: 'POST',
      url: '/api/publishing/approve-for-publish',
      payload: { workspaceId, contentId, approvedBy: 'operator@nexus' },
    })
    assert.equal(apRes.statusCode, 200)
    assert.equal(apRes.json().approvedForPublishing, true)

    const contentRow = getDb()
      .prepare(`SELECT approved_for_publishing FROM contents WHERE id=?`)
      .get(contentId) as { approved_for_publishing: number }
    assert.equal(contentRow.approved_for_publishing, 1)

    // --- Preflight sees both gates ---
    const pfRes = await app.inject({
      method: 'GET',
      url: `/api/validation/preflight?workspaceId=${workspaceId}&contentId=${contentId}`,
    })
    assert.equal(pfRes.statusCode, 200)
    const checks = pfRes.json().checks as Array<{ id: string; status: string; detail?: string }>
    assert.equal(checks.find((c) => c.id === 'content_package')?.status, 'PASS')
    assert.equal(checks.find((c) => c.id === 'human_approval')?.status, 'PASS')
    assert.equal(checks.find((c) => c.id === 'ffmpeg')?.status, 'PASS')

    // --- Kill switches stay safe by default ---
    const safetyRes = await app.inject({ method: 'GET', url: '/api/validation/safety' })
    const safety = safetyRes.json()
    assert.equal(safety.isDefaultSafe, true, 'kill switches must be safe by default')
    assert.equal(safety.snapshot.globalPublishingKillSwitch, true)
    assert.equal(safety.snapshot.publishingEnabled, false)
    assert.equal(pfRes.json().safe, true)
    assert.equal(pfRes.json().readyToPublish, false, 'never ready-to-publish while safe defaults hold')
  })

  it('breaks it — production refuses a draft script with an actionable 409, no DLQ noise', async () => {
    const ideaRes = await app.inject({
      method: 'POST',
      url: '/api/ideas',
      payload: { workspaceId, title: 'Script rascunho nunca deve produzir' },
    })
    const ideaId = ideaRes.json().id as string

    const draftId = uid()
    getDb()
      .prepare(
        `INSERT INTO scripts
         (id, workspace_id, idea_id, hook, body, cta, caption, hashtags, visual_brief,
          qa_status, qa_notes, reality, created_at, platform, status)
         VALUES (?, ?, ?, 'hook', '{}', 'cta', 'cap', '[]', '{}', 'requires_review', '[]', 'MOCK', ?, 'YOUTUBE_SHORT', 'draft')`,
      )
      .run(draftId, workspaceId, ideaId, nowIso())

    const dlqBefore = (
      getDb().prepare(`SELECT COUNT(*) c FROM automation_failures`).get() as { c: number }
    ).c

    const res = await app.inject({
      method: 'POST',
      url: '/api/production/run',
      payload: { workspaceId, scriptId: draftId, platform: 'YOUTUBE_SHORT', await: true },
    })

    assert.equal(res.statusCode, 409, 'a rejected approval gate is a client error, not a 500')
    const body = res.json()
    assert.equal(body.error, 'script_not_approved')
    assert.ok(body.hint, 'the operator must be told how to unblock (approve the script)')
    assert.equal(body.scriptStatus, 'draft')

    // The guard rail must not create a production run, nor a dead letter.
    const created = getDb()
      .prepare(`SELECT COUNT(*) c FROM production_runs WHERE script_id=?`)
      .get(draftId) as { c: number }
    assert.equal(created.c, 0, 'no production run may be created for an unapproved script')
    const dlqAfter = (
      getDb().prepare(`SELECT COUNT(*) c FROM automation_failures`).get() as { c: number }
    ).c
    assert.equal(dlqAfter, dlqBefore, 'an approval rejection must not land in the DLQ')
  })

  it('breaks it — production on an unknown script returns 404, not 500', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/production/run',
      payload: { workspaceId, scriptId: uid(), platform: 'YOUTUBE_SHORT', await: true },
    })
    assert.equal(res.statusCode, 404)
    assert.equal(res.json().error, 'script_not_found')
  })

  it('breaks it — idempotent_skip is never silent and regenerate escapes it', async () => {
    const ideaRes = await app.inject({
      method: 'POST',
      url: '/api/ideas',
      payload: { workspaceId, title: 'Idempotencia observavel' },
    })
    const ideaId = ideaRes.json().id as string

    const scriptRes = await app.inject({
      method: 'POST',
      url: '/api/scripts/generate',
      payload: { workspaceId, contentIdeaId: ideaId, platform: 'YOUTUBE_SHORT', await: true },
    })
    const scriptId = scriptRes.json().result.scriptId as string
    await app.inject({
      method: 'POST',
      url: `/api/scripts/${scriptId}/approve`,
      payload: { workspaceId },
    })

    const first = await app.inject({
      method: 'POST',
      url: '/api/production/run',
      payload: { workspaceId, scriptId, platform: 'YOUTUBE_SHORT', await: true },
    })
    assert.equal(first.json().result.packageStatus, 'READY_FOR_PUBLISH')
    const firstRunId = first.json().productionRunId as string

    // Same click again: skipped, but with guidance the UI can surface.
    const second = await app.inject({
      method: 'POST',
      url: '/api/production/run',
      payload: { workspaceId, scriptId, platform: 'YOUTUBE_SHORT', await: true },
    })
    const skipped = second.json().result
    assert.equal(skipped.skipped, true)
    assert.equal(skipped.reason, 'idempotent_skip')
    assert.ok(skipped.hint, 'idempotent_skip must explain itself')
    assert.equal(skipped.nextAction, 'retry_with_regenerate')
    assert.equal(skipped.productionRunId, firstRunId)

    // Regenerate produces a genuinely new run that is READY again.
    const third = await app.inject({
      method: 'POST',
      url: '/api/production/run',
      payload: { workspaceId, scriptId, platform: 'YOUTUBE_SHORT', regenerate: true, await: true },
    })
    const regen = third.json().result
    assert.equal(regen.skipped, false)
    assert.notEqual(third.json().productionRunId, firstRunId)
    assert.equal(regen.packageStatus, 'READY_FOR_PUBLISH')

    // Second run reuses the library (HIT) and must not be demoted to UNKNOWN license.
    const regenStages = regen.result.stages as Record<string, { library?: { hits: number } }>
    assert.ok((regenStages.VISUALS.library?.hits ?? 0) >= 1, 'library HIT expected on regenerate')
    const regenDetail = await app.inject({
      method: 'GET',
      url: `/api/production/runs/${third.json().productionRunId}`,
    })
    const badLicense = (
      regenDetail.json().assets as Array<{ license: string; is_current: number }>
    ).filter((a) => a.is_current === 1 && (!a.license || a.license === 'UNKNOWN'))
    assert.equal(badLicense.length, 0, 'library HIT must not set license=UNKNOWN')
  })

  it('breaks it — script factory idempotent_skip carries the existing scriptId and a way out', async () => {
    const ideaRes = await app.inject({
      method: 'POST',
      url: '/api/ideas',
      payload: { workspaceId, title: 'Script duas vezes na mesma idea' },
    })
    const ideaId = ideaRes.json().id as string

    const first = await app.inject({
      method: 'POST',
      url: '/api/scripts/generate',
      payload: { workspaceId, contentIdeaId: ideaId, platform: 'YOUTUBE_SHORT', await: true },
    })
    const firstScriptId = first.json().result.scriptId as string
    assert.ok(firstScriptId)

    const second = await app.inject({
      method: 'POST',
      url: '/api/scripts/generate',
      payload: { workspaceId, contentIdeaId: ideaId, platform: 'YOUTUBE_SHORT', await: true },
    })
    const skipped = second.json().result
    assert.equal(skipped.skipped, true)
    assert.equal(skipped.reason, 'idempotent_skip')
    assert.equal(
      skipped.scriptId,
      firstScriptId,
      'the operator must be pointed at the script that already exists',
    )
    assert.ok(skipped.hint)
    assert.equal(skipped.nextAction, 'retry_with_regenerate')

    const regen = await app.inject({
      method: 'POST',
      url: '/api/scripts/generate',
      payload: {
        workspaceId,
        contentIdeaId: ideaId,
        platform: 'YOUTUBE_SHORT',
        regenerate: true,
        await: true,
      },
    })
    const regenBody = regen.json().result
    assert.equal(regenBody.skipped, false)
    assert.ok(regenBody.scriptId)
    assert.notEqual(regenBody.scriptId, firstScriptId)
    const regenRow = getDb()
      .prepare(`SELECT platform FROM scripts WHERE id=?`)
      .get(regenBody.scriptId) as { platform: string }
    assert.equal(regenRow.platform, 'YOUTUBE_SHORT')
  })

  it('breaks it — script generate on an unknown idea returns 404, not 500', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/scripts/generate',
      payload: { workspaceId, contentIdeaId: uid(), platform: 'YOUTUBE_SHORT', await: true },
    })
    assert.equal(res.statusCode, 404)
    assert.equal(res.json().error, 'content_idea_not_found')
  })

  it('breaks it — approve-for-publish on an unknown content must 404 instead of lying ok:true', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/publishing/approve-for-publish',
      payload: { workspaceId, contentId: uid(), approvedBy: 'operator@nexus' },
    })
    assert.equal(res.statusCode, 404)
    assert.equal(res.json().error, 'content_not_found')
  })

  it('breaks it — omitting platform still yields YOUTUBE_SHORT, never TIKTOK', async () => {
    const ideaRes = await app.inject({
      method: 'POST',
      url: '/api/ideas',
      payload: { workspaceId, title: 'Plataforma omitida deve virar YouTube Short' },
    })
    const ideaId = ideaRes.json().id as string

    const scriptRes = await app.inject({
      method: 'POST',
      url: '/api/scripts/generate',
      payload: { workspaceId, contentIdeaId: ideaId, await: true },
    })
    const scriptId = scriptRes.json().result.scriptId as string
    const row = getDb().prepare(`SELECT platform FROM scripts WHERE id=?`).get(scriptId) as {
      platform: string
    }
    assert.equal(row.platform, 'YOUTUBE_SHORT')

    await app.inject({
      method: 'POST',
      url: `/api/scripts/${scriptId}/approve`,
      payload: { workspaceId },
    })
    const prodRes = await app.inject({
      method: 'POST',
      url: '/api/production/run',
      payload: { workspaceId, scriptId, await: true },
    })
    const runId = prodRes.json().productionRunId as string
    const plan = JSON.parse(
      (getDb().prepare(`SELECT plan FROM production_runs WHERE id=?`).get(runId) as { plan: string })
        .plan,
    )
    assert.equal(plan.platform, 'YOUTUBE_SHORT')
    assert.equal(plan.aspectRatio, '9:16')
  })
})
