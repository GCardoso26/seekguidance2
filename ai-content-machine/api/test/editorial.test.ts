import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { resetDbForTests, getDb, uid, nowIso } from '../src/db/client.js'
import { buildServer } from '../src/server.js'
import { bootstrapWorkspace } from '../src/services/pipelines/dailyContentEngine.js'
import { productionService } from '../src/production/ProductionService.js'
import { qaScript } from '../src/scriptFactory/ScriptQaService.js'
import { scoreIdeas } from '../src/editorial/IdeaScorer.js'
import { proposeTitles, scoreTitle } from '../src/editorial/TitleScorer.js'
import { scoreOriginality } from '../src/editorial/OriginalityService.js'
import { evaluateRights } from '../src/editorial/RightsGate.js'
import { adaptLongFormToShort, adaptScriptToShort, assertShortComplete } from '../src/editorial/ShortAdapter.js'
import { planEditorialDryRun } from '../src/editorial/EditorialDryRun.js'
import { buildEditorialPackage, MONETIZATION_NOTE } from '../src/editorial/EditorialPackageBuilder.js'
import { reviewVisualPublishability } from '../src/production/PublishingQualityGate.js'
import type { ScriptGenerationContext, StructuredScript } from '../src/scriptFactory/types.js'

process.env.AUTOMATION_MODE = 'mock'
process.env.CWM_FAST_RETRY = '1'
delete process.env.COMFY_BASE_URL
delete process.env.KOKORO_BASE_URL
delete process.env.OLLAMA_BASE_URL

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
     VALUES (?, ?, ?, 'IA sem sistema', '[]', 0.8, 0.7, 0.6, 'MOCK', ?, 'fp-ed-${topicId}', 80, '{}')`,
  ).run(topicId, workspaceId, niche.id, nowIso())
  db.prepare(
    `INSERT INTO content_ideas
     (id, workspace_id, topic_id, title, hooks, angles, formats, opportunity_score, status, reality, created_at)
     VALUES (?, ?, ?, 'Por que usar IA sem um sistema custa tempo', '[]', '[]', '[]', 0.9, 'selected', 'MOCK', ?)`,
  ).run(ideaId, workspaceId, topicId, nowIso())
  const body = {
    hook: 'Você está a perder duas horas por dia e chama isso de produtividade com IA?',
    setup: 'A maioria abre cinco ferramentas e chama isso de sistema.',
    problem: 'Sem um fluxo, cada tarefa recomeça do zero.',
    insight: 'Um único pipeline com briefing, execução e gate muda o jogo.',
    value: 'O mesmo personagem, o mesmo escritório, o mesmo CTA honesto.',
    proof: 'O pacote sai com QA — não com promessa de renda.',
    cta: 'O link está na descrição. Sem milagre.',
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
  return { scriptId, ideaId, body }
}

const mockImage = {
  type: 'IMAGE',
  is_current: 1,
  file_size: 12000,
  checksum: 'a'.repeat(64),
  uri: '/tmp/scene.png',
  asset_key: 'visual:scene:1',
  provider: 'mock_visual',
  source_type: 'MOCK',
  license: 'MOCK',
}

describe('canal-dark editorial layer (no parallel factory)', () => {
  const tmp = path.join(os.tmpdir(), `cwm-editorial-${Date.now()}.sqlite`)
  let app: Awaited<ReturnType<typeof buildServer>>
  let workspaceId = ''

  before(async () => {
    resetDbForTests(tmp)
    app = await buildServer()
    const boot = await bootstrapWorkspace({ name: 'Canal Dark Lab', email: 'canal-dark@cwm.test' })
    workspaceId = boot.workspaceId
  })

  after(async () => {
    await app.close()
  })

  it('scores ideas 0–100 with required dimensions', () => {
    const ranked = scoreIdeas([
      {
        title: 'Por que usar IA sem um sistema custa 2 horas por dia?',
        angle: 'custo do improviso',
        audience: 'profissionais que querem ia e tempo',
        historyTitles: ['Outro tema qualquer'],
      },
      {
        title: 'Clipe da Taylor Swift na Netflix',
        angle: 'copyright',
        historyTitles: ['Clipe da Taylor Swift na Netflix'],
      },
    ])
    assert.equal(ranked.length, 2)
    const first = ranked[0]
    for (const k of [
      'curiosity',
      'emotional_value',
      'visual_potential',
      'originality',
      'audience_fit',
      'short_potential',
      'rights_risk',
      'repetition_risk',
    ] as const) {
      assert.ok(first.scores[k] >= 0 && first.scores[k] <= 100)
    }
    assert.ok(ranked[1].reviewRequired)
    assert.ok(ranked[1].scores.rights_risk >= 70 || ranked[1].scores.repetition_risk >= 70)
  })

  it('proposes 5–10 titles and flags dishonest clickbait', () => {
    const titles = proposeTitles('sistema de IA faceless', 'sem guru')
    assert.ok(titles.length >= 5 && titles.length <= 10)
    const bad = scoreTitle('Fique rico sem esforço e ganhe milhões com IA garantido')
    assert.equal(bad.dishonestClickbait, true)
    assert.equal(bad.reviewRequired, true)
    assert.ok(bad.scores.honesty < 60)
  })

  it('originality/repetition vs history → REVIEW_REQUIRED', () => {
    const v = scoreOriginality({
      title: 'O erro de tratar IA como ferramenta solta',
      hook: 'Pare de perder 2h por dia',
      cta: 'Link na descrição',
      history: {
        titles: ['O erro de tratar IA como ferramenta solta'],
        hooks: ['Pare de perder 2h por dia'],
        ctas: ['Link na descrição'],
      },
    })
    assert.ok(v.repetitionScore >= 55)
    assert.equal(v.reviewRequired, true)
  })

  it('Rights Gate: UNKNOWN blocks auto-publish; never invents credits', () => {
    const unknown = evaluateRights({ assets: [] })
    assert.equal(unknown.classification, 'UNKNOWN')
    assert.equal(unknown.autoPublishBlocked, true)
    const invented = evaluateRights({
      assets: [{ license: 'LICENSED', type: 'IMAGE' }],
      inventCredits: true,
    })
    assert.ok(invented.findings.includes('credits_must_not_be_invented'))
    const mock = evaluateRights({
      assets: [{ provider: 'mock_visual', source_type: 'MOCK', license: 'MOCK', type: 'IMAGE' }],
    })
    assert.equal(mock.classification, 'UNKNOWN')
  })

  it('Short adapt is editorial (HOOK/CONTEXT/ESCALATION/PAYOFF/CTA), not a crop flag', () => {
    const short = adaptScriptToShort({
      hook: 'Você está a perder duas horas por dia com IA solta?',
      setup: 'Abrir cinco apps não é um sistema.',
      problem: 'Cada tarefa recomeça do zero.',
      insight: 'Um pipeline com gate muda o jogo.',
      value: 'Mesmo personagem, mesmo escritório.',
      proof: 'O pacote sai com QA.',
      cta: 'Link na descrição. Sem milagre.',
    })
    assert.deepEqual(Object.keys(short).sort(), ['context', 'cta', 'escalation', 'hook', 'payoff'].sort())
    assert.equal(assertShortComplete(short).length, 0)
    const fromLong = adaptLongFormToShort({
      hook: 'O custo silencioso começa no primeiro tab.',
      context: 'Ferramentas sem briefing.',
      open_loop: 'Quanto tempo isso já comeu esta semana?',
      act_1: 'O improviso parece rápido.',
      escalation: 'Depois o retrabalho chega.',
      act_2: 'Um fluxo único corta o loop.',
      revelation: 'O sistema é o produto, não o modelo.',
      act_3: 'Character lock e Visual Bible.',
      payoff: 'Um Short honesto, sem crop preguiçoso.',
      cta: 'Descrição. Sem renda garantida.',
    })
    assert.ok(fromLong.hook.length > 8)
    assert.equal(assertShortComplete(fromLong).length, 0)
  })

  it('dry-run lists stages/providers without running production', () => {
    const plan = planEditorialDryRun({
      existingStages: {
        PLANNING: { ok: true, provider: 'ProductionPlanner' },
        VOICE: { ok: true, provider: 'mock_voice' },
        VISUALS: { ok: true, provider: 'mock_visual' },
      },
    })
    assert.equal(plan.destructive, false)
    assert.equal(plan.resumeFrom, 'SUBTITLES')
    const voice = plan.stages.find((s) => s.stage === 'VOICE')
    assert.equal(voice?.status, 'DONE')
    assert.ok(plan.stages.some((s) => s.stage === 'COMPOSING'))
  })

  it('editorial package: mock_visual → READY_FOR_REVIEW, never PUBLISH; monetization disclaimer', () => {
    const outDir = path.join(os.tmpdir(), `cwm-pkg-${Date.now()}`)
    const first = buildEditorialPackage({
      outputDir: outDir,
      channel: { name: 'Nexus Faceless Lab' },
      idea: { title: 'Por que usar IA sem um sistema custa 2 horas por dia' },
      scriptMd: '# HOOK\nVocê está a perder duas horas?\n',
      assets: [
        mockImage,
        {
          type: 'AUDIO',
          is_current: 1,
          file_size: 1000,
          checksum: 'b'.repeat(64),
          provider: 'mock_voice',
          license: 'MOCK',
        },
        {
          type: 'FINAL_VIDEO',
          is_current: 1,
          file_size: 8000,
          checksum: 'c'.repeat(64),
          license: 'MOCK',
        },
        {
          type: 'THUMBNAIL',
          is_current: 1,
          file_size: 4000,
          checksum: 'd'.repeat(64),
          license: 'MOCK',
        },
        {
          type: 'SUBTITLE',
          is_current: 1,
          file_size: 100,
          checksum: 'e'.repeat(64),
          license: 'MOCK',
        },
      ],
      credits: [],
      version: 1,
    })
    assert.equal(first.packageStatus, 'READY_FOR_REVIEW')
    assert.equal(first.visualAuthorized, false)
    assert.equal(first.monetizationNote, MONETIZATION_NOTE)
    assert.ok(fs.existsSync(path.join(outDir, 'qa-report.md')))
    const review = reviewVisualPublishability([mockImage])
    assert.equal(review.authorized, false)

    const second = buildEditorialPackage({
      outputDir: outDir + '-b',
      channel: { name: 'Nexus Faceless Lab' },
      idea: { title: 'Por que usar IA sem um sistema custa 2 horas por dia' },
      scriptMd: '# HOOK\nVocê está a perder duas horas?\n',
      assets: [mockImage],
      version: 1,
    })
    const third = buildEditorialPackage({
      outputDir: outDir + '-c',
      channel: { name: 'Nexus Faceless Lab' },
      idea: { title: 'Por que usar IA sem um sistema custa 2 horas por dia' },
      scriptMd: '# HOOK\nVocê está a perder duas horas?\n',
      assets: [mockImage],
      version: 1,
    })
    assert.equal(second.sha256, third.sha256)
  })

  it('ScriptQa attaches originality scores without a second LLM layer', () => {
    const script: StructuredScript = {
      hook: 'Pare de perder 2h por dia com ferramentas soltas',
      setup: 'Abrir apps não é sistema e isso precisa ficar claro agora mesmo.',
      problem: 'Retrabalho diário quando não há briefing nem gate de qualidade.',
      insight: 'Um pipeline único com visual bible evita o caos.',
      value: 'O mesmo personagem em todas as cenas do Short.',
      proof: 'QA e rights gate travam o publish automático.',
      cta: 'O link está na descrição, sem promessa de renda.',
    }
    const ctx = {
      niche: { id: 'n', name: 'IA' },
      targetAudience: 'faceless',
      contentIdea: { id: 'i', title: 'IA sem sistema', angles: [], hooks: [] },
      angle: 'lista',
      brandVoice: {},
      platform: 'YOUTUBE_SHORT',
      targetDuration: 40,
      winningHooks: ['Pare de perder 2h por dia com ferramentas soltas'],
      winningTopics: [],
      previousPerformance: [],
      ctaStrategy: 'link na descrição',
    } as ScriptGenerationContext
    const qa = qaScript(script, ctx)
    assert.ok(typeof qa.breakdown.originalityScore === 'number')
    assert.ok(typeof qa.breakdown.repetitionScore === 'number')
    assert.ok(qa.notes.some((n) => n.includes('repetition') || n.includes('originality') || n.includes('hook')))
  })

  it('HTTP: ideas/score, titles, shorts, thumbnail, rights, dry-run, package', async () => {
    const ideas = await app.inject({
      method: 'POST',
      url: '/api/editorial/ideas/score',
      payload: {
        audience: 'ia tempo renda',
        ideas: [
          { title: 'Por que usar IA sem um sistema custa 2 horas por dia?' },
          { title: 'O erro de tratar IA como ferramenta solta' },
        ],
      },
    })
    assert.equal(ideas.statusCode, 200)
    assert.ok(ideas.json().ideas[0].composite >= 0)

    const titles = await app.inject({
      method: 'POST',
      url: '/api/editorial/titles/score',
      payload: { seed: 'sistema de IA faceless' },
    })
    assert.equal(titles.statusCode, 200)
    assert.ok(titles.json().titles.length >= 5)

    const short = await app.inject({
      method: 'POST',
      url: '/api/editorial/shorts/adapt',
      payload: {
        longForm: {
          hook: 'Duas horas somem no improviso com IA.',
          context: 'Cinco abas abertas.',
          open_loop: 'Quanto isso já custou?',
          act_1: 'Parece rápido.',
          escalation: 'O retrabalho chega.',
          act_2: 'Um fluxo corta o loop.',
          revelation: 'O sistema é o produto.',
          act_3: 'Visual Bible.',
          payoff: 'Short honesto.',
          cta: 'Descrição, sem milagre.',
        },
      },
    })
    assert.equal(short.statusCode, 200)
    assert.equal(short.json().crop, false)

    const thumb = await app.inject({
      method: 'POST',
      url: '/api/editorial/thumbnail/score',
      payload: {
        title: 'O erro de tratar IA como ferramenta solta',
        visualStyle: 'documentary_cinematic',
      },
    })
    assert.equal(thumb.statusCode, 200)
    assert.ok(thumb.json().prompt.includes('SUBJECT:'))

    const rights = await app.inject({
      method: 'POST',
      url: '/api/editorial/rights',
      payload: { assets: [{ provider: 'mock_visual', source_type: 'MOCK' }] },
    })
    assert.equal(rights.statusCode, 200)
    assert.equal(rights.json().autoPublishBlocked, true)

    const dry = await app.inject({ method: 'POST', url: '/api/editorial/dry-run', payload: {} })
    assert.equal(dry.statusCode, 200)
    assert.equal(dry.json().destructive, false)

    const pkg = await app.inject({
      method: 'POST',
      url: '/api/editorial/package',
      payload: {
        channel: { name: 'Nexus Faceless Lab', language: 'pt-BR' },
        idea: { title: 'O erro de tratar IA como ferramenta solta' },
        assets: [mockImage],
      },
    })
    assert.equal(pkg.statusCode, 200)
    assert.equal(pkg.json().packageStatus, 'READY_FOR_REVIEW')
    assert.equal(pkg.json().visualAuthorized, false)
  })

  it('E2E mock: production MP4 exists but editorial+PublishingQualityGate block publish', async () => {
    const { scriptId, body } = seedApprovedScript(workspaceId)
    const out = await productionService.run({
      workspaceId,
      scriptId,
      platform: 'YOUTUBE_SHORT',
      targetDurationOverride: 2,
    })
    assert.equal(out.packageStatus, 'READY_FOR_REVIEW')
    const detail = productionService.getRun(out.productionRunId!)!
    const assets = detail.assets as Array<Record<string, unknown>>
    const images = assets.filter((a) => a.type === 'IMAGE')
    assert.ok(images.length >= 1)
    assert.ok(images.every((a) => a.provider === 'mock_visual' || a.source_type === 'MOCK'))

    const pkg = buildEditorialPackage({
      outputDir: path.join(os.tmpdir(), `cwm-ed-e2e-${Date.now()}`),
      channel: { name: 'Nexus Faceless Lab' },
      idea: { title: 'Por que usar IA sem um sistema custa tempo' },
      scriptMd: `# Long-form briefing\n\nHOOK ${body.hook}\n`,
      storyboard: (detail as { result?: unknown }).result,
      assets,
      productionId: out.productionRunId,
      version: 1,
    })
    assert.equal(pkg.packageStatus, 'READY_FOR_REVIEW')
    assert.equal(pkg.visualAuthorized, false)
    assert.ok(pkg.files.includes('publish.txt'))

    const resume = planEditorialDryRun({
      existingStages: {
        PLANNING: { ok: true },
        VOICE: { ok: true },
        VISUALS: { ok: true },
        SUBTITLES: { ok: true },
        COMPOSING: { ok: false },
      },
    })
    assert.equal(resume.resumeFrom, 'COMPOSING')
  })
})
