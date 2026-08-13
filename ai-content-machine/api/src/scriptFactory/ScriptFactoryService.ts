import { config } from '../config.js'
import { getDb, uid, nowIso } from '../db/client.js'
import { emitEvent } from '../services/EventService.js'
import { alreadyProcessed, markProcessed } from '../lib/idempotency.js'
import { withRetry } from '../lib/retry.js'
import { recordAiCost } from '../services/AiCostService.js'
import { getActivePrompt } from '../services/PromptService.js'
import { buildScriptContext } from './ContextBuilder.js'
import { generateCta } from './CtaGenerator.js'
import { generateCaption } from './CaptionGenerator.js'
import { generateVisualBrief } from './VisualBriefGenerator.js'
import { qaScript } from './ScriptQaService.js'
import { resolvePlatform } from './PlatformProfiles.js'
import type { PlatformKey } from './types.js'
import { MockScriptProvider } from './providers/MockScriptProvider.js'
import { OllamaScriptProvider } from './providers/OllamaScriptProvider.js'
import { ApiScriptProvider } from './providers/ApiScriptProvider.js'
import { FallbackScriptProvider } from './providers/FallbackScriptProvider.js'

export type ScriptFactoryInput = {
  workspaceId: string
  contentIdeaId: string
  platform?: string
  executionId?: string
  /** Force a brand new script for an idea that already has one (escapes idempotent_skip). */
  regenerate?: boolean
  /** test hooks */
  forceQaFail?: boolean
  forceAiFailTimes?: number
}

function scriptIdemKey(contentIdeaId: string, promptVersion: number, platform: string) {
  return `script:${contentIdeaId}:pv${promptVersion}:${platform}`
}

/** Best-effort scriptId of a previous run, so a skip can point at what already exists. */
function scriptIdOfRun(run: unknown): string | undefined {
  const result = (run as { result?: string } | undefined)?.result
  try {
    return (JSON.parse(result || '{}') as { scriptId?: string }).scriptId
  } catch {
    return undefined
  }
}

export class ScriptFactoryService {
  private ollama = new OllamaScriptProvider()
  private api = new ApiScriptProvider()
  private mock = new MockScriptProvider()
  /** Factory only talks to the resolver — not Ollama/API/Mock directly. */
  private scriptProvider = new FallbackScriptProvider(this.ollama, this.api, this.mock)

  providersStatus() {
    return {
      resolver: this.scriptProvider.name,
      ollama: this.ollama.status(),
      api: this.api.status(),
      mock: this.mock.status(),
      status: this.scriptProvider.status(),
    }
  }

  async run(input: ScriptFactoryInput) {
    const db = getDb()
    const platform = resolvePlatform(input.platform)
    const prompt = getActivePrompt('script_generator')
    const promptVersion = prompt?.version ?? 1
    const baseIdemKey = scriptIdemKey(input.contentIdeaId, promptVersion, platform)

    if (!input.regenerate && alreadyProcessed(baseIdemKey)) {
      const existing = db.prepare(`SELECT * FROM script_runs WHERE idempotency_key = ?`).get(baseIdemKey)
      const existingScriptId = scriptIdOfRun(existing)
      return {
        skipped: true,
        reason: 'idempotent_skip',
        // Never a dead end: name the script that already exists and how to force a new one.
        hint:
          `Esta idea já gerou um script para ${platform}` +
          (existingScriptId ? ` (scriptId=${existingScriptId})` : '') +
          '. Selecione-o para Approve/Production, ou reenvie com regenerate=true para gerar outro.',
        nextAction: 'retry_with_regenerate' as const,
        scriptId: existingScriptId,
        scriptRunId: (existing as { id?: string } | undefined)?.id,
        scriptRun: existing,
        platform,
        reality: 'MOCK' as const,
      }
    }

    const idea = db
      .prepare(`SELECT id FROM content_ideas WHERE id = ? AND workspace_id = ?`)
      .get(input.contentIdeaId, input.workspaceId)
    if (!idea) throw new Error('content_idea_not_found')

    const runId = uid()
    const idempotencyKey = input.regenerate ? `${baseIdemKey}:regen:${runId}` : baseIdemKey
    db.prepare(
      `INSERT INTO script_runs
       (id, workspace_id, content_idea_id, status, started_at, reality, execution_id, idempotency_key, platform, created_at)
       VALUES (?, ?, ?, 'RUNNING', ?, ?, ?, ?, ?, ?)`,
    ).run(
      runId,
      input.workspaceId,
      input.contentIdeaId,
      nowIso(),
      config.automationMode === 'mock' ? 'MOCK' : 'PENDING',
      input.executionId ?? null,
      idempotencyKey,
      platform,
      nowIso(),
    )

    emitEvent({
      workspaceId: input.workspaceId,
      eventType: 'script.started',
      entityType: 'script_run',
      entityId: runId,
      reality: 'MOCK',
    })

    let aiAttempts = 0
    const failTimes = input.forceAiFailTimes ?? 0

    const gen = await withRetry(async () => {
      aiAttempts += 1
      if (aiAttempts <= failTimes) throw new Error(`ai_provider_fail_attempt_${aiAttempts}`)

      const ctx = buildScriptContext(input.workspaceId, input.contentIdeaId, platform as PlatformKey)
      const pack = await this.scriptProvider.generate(ctx)
      const cta = generateCta(ctx, pack.script.cta)
      pack.script.cta = cta
      const captionPack = generateCaption(ctx, pack.bestHook.text)
      const visualBrief = generateVisualBrief(ctx, pack.script)
      const qa = qaScript(pack.script, ctx, { forceFail: input.forceQaFail })

      return { ctx, pack, captionPack, visualBrief, qa }
    })

    if (!gen.ok) {
      db.prepare(
        `UPDATE script_runs SET status='FAILED', completed_at=?, error=?, provider=?, model=? WHERE id=?`,
      ).run(nowIso(), gen.failure.error, 'script_fallback', 'unknown', runId)

      db.prepare(
        `INSERT INTO automation_failures
         (id, workflow, execution_id, entity_type, entity_id, error, payload, attempts, status, created_at)
         VALUES (?, 'script_factory', ?, 'script_run', ?, ?, ?, ?, 'open', ?)`,
      ).run(
        uid(),
        input.executionId ?? runId,
        runId,
        gen.failure.error,
        JSON.stringify({ contentIdeaId: input.contentIdeaId, platform }),
        gen.failure.attempts,
        nowIso(),
      )

      emitEvent({
        workspaceId: input.workspaceId,
        eventType: 'script.failed',
        entityType: 'script_run',
        entityId: runId,
        reality: 'FAILED',
      })

      return {
        skipped: false,
        scriptRunId: runId,
        status: 'FAILED' as const,
        error: gen.failure.error,
        reality: 'FAILED' as const,
      }
    }

    const { pack, captionPack, visualBrief, qa } = gen.value
    const reality = pack.provider === 'mock' ? ('MOCK' as const) : ('REAL' as const)
    const cost =
      pack.estimatedCostCents ??
      (pack.provider === 'mock' ? 5 : Math.max(1, Math.round((pack.tokensIn + pack.tokensOut) / 1000)))
    const tokensIn = pack.tokensIn + qa.tokensIn
    const tokensOut = pack.tokensOut + qa.tokensOut
    const totalCost = cost + qa.route.estimatedCostCents

    recordAiCost({
      workspaceId: input.workspaceId,
      operation: 'script_generation',
      provider: pack.provider,
      model: pack.model,
      inputTokens: pack.tokensIn,
      outputTokens: pack.tokensOut,
      estimatedCostCents: cost,
      contentIdeaId: input.contentIdeaId,
      scriptRunId: runId,
      reality,
    })
    recordAiCost({
      workspaceId: input.workspaceId,
      operation: 'qa',
      provider: qa.route.provider,
      model: qa.route.model,
      inputTokens: qa.tokensIn,
      outputTokens: qa.tokensOut,
      estimatedCostCents: qa.route.estimatedCostCents,
      contentIdeaId: input.contentIdeaId,
      scriptRunId: runId,
      reality: 'MOCK',
    })

    const scriptStatus =
      qa.status === 'pass' ? 'ready' : qa.status === 'requires_review' ? 'requires_review' : 'failed'
    const qaStatus =
      qa.status === 'pass' ? 'passed' : qa.status === 'requires_review' ? 'requires_review' : 'failed'

    const scriptId = uid()
    db.prepare(
      `INSERT INTO scripts
       (id, workspace_id, idea_id, hook, body, cta, caption, hashtags, visual_brief,
        qa_status, qa_notes, reality, created_at, platform, status, quality_score, quality_breakdown,
        script_run_id, selected_hooks)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      scriptId,
      input.workspaceId,
      input.contentIdeaId,
      pack.script.hook,
      JSON.stringify(pack.script),
      pack.script.cta,
      captionPack.caption,
      JSON.stringify(captionPack.hashtags),
      JSON.stringify(visualBrief),
      qaStatus,
      JSON.stringify(qa.notes),
      reality,
      nowIso(),
      platform,
      scriptStatus,
      qa.score,
      JSON.stringify(qa.breakdown),
      runId,
      JSON.stringify(pack.hooks),
    )

    emitEvent({
      workspaceId: input.workspaceId,
      eventType: 'script.created',
      entityType: 'script',
      entityId: scriptId,
      payload: {
        scriptRunId: runId,
        qaStatus,
        platform,
        provider: pack.provider,
        fallbackTrail: pack.fallbackTrail,
      },
      reality,
    })

    db.prepare(
      `UPDATE script_runs SET status=?, completed_at=?, model=?, provider=?, tokens_input=?, tokens_output=?,
        estimated_cost_cents=?, result=?, reality=? WHERE id=?`,
    ).run(
      qa.status === 'fail' ? 'FAILED' : 'COMPLETED',
      nowIso(),
      pack.model,
      pack.provider,
      tokensIn,
      tokensOut,
      totalCost,
      JSON.stringify({
        scriptId,
        hooks: pack.hooks.length,
        bestHook: pack.bestHook,
        qaStatus,
        scriptStatus,
        provider: pack.provider,
        model: pack.model,
        durationMs: pack.durationMs,
        fallbackTrail: pack.fallbackTrail,
      }),
      reality,
      runId,
    )

    emitEvent({
      workspaceId: input.workspaceId,
      eventType: qa.status === 'fail' ? 'script.failed' : 'script.completed',
      entityType: 'script_run',
      entityId: runId,
      reality: qa.status === 'fail' ? 'FAILED' : reality,
      payload: { provider: pack.provider, fallbackTrail: pack.fallbackTrail },
    })

    markProcessed({
      eventId: idempotencyKey,
      workflow: 'script_factory',
      executionId: input.executionId,
      entityType: 'script_run',
      entityId: runId,
    })

    return {
      skipped: false,
      scriptRunId: runId,
      scriptId,
      platform,
      status: qa.status === 'fail' ? 'FAILED' : 'COMPLETED',
      scriptStatus,
      qaStatus,
      hooks: pack.hooks,
      bestHook: pack.bestHook,
      script: pack.script,
      caption: captionPack.caption,
      hashtags: captionPack.hashtags,
      visualBrief,
      qualityScore: qa.score,
      qualityBreakdown: qa.breakdown,
      costCents: totalCost,
      tokens: tokensIn + tokensOut,
      provider: pack.provider,
      model: pack.model,
      durationMs: pack.durationMs,
      fallbackTrail: pack.fallbackTrail,
      providers: this.providersStatus(),
      route: { provider: pack.provider, model: pack.model },
      reality,
    }
  }

  getRun(id: string) {
    return getDb().prepare(`SELECT * FROM script_runs WHERE id = ?`).get(id)
  }

  listRuns(workspaceId: string, limit = 50) {
    return getDb()
      .prepare(`SELECT * FROM script_runs WHERE workspace_id = ? ORDER BY created_at DESC LIMIT ?`)
      .all(workspaceId, limit)
  }
}

export const scriptFactoryService = new ScriptFactoryService()
