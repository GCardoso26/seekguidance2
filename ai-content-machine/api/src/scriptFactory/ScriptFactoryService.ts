import { config } from '../config.js'
import { getDb, uid, nowIso } from '../db/client.js'
import { emitEvent } from '../services/EventService.js'
import { alreadyProcessed, markProcessed } from '../lib/idempotency.js'
import { withRetry } from '../lib/retry.js'
import { recordAiCost } from '../services/AiCostService.js'
import { getActivePrompt } from '../services/PromptService.js'
import { buildScriptContext } from './ContextBuilder.js'
import { generateHooks } from './HookGenerator.js'
import { generateStructuredScript } from './ScriptGenerator.js'
import { generateCta } from './CtaGenerator.js'
import { generateCaption } from './CaptionGenerator.js'
import { generateVisualBrief } from './VisualBriefGenerator.js'
import { qaScript } from './ScriptQaService.js'
import { resolvePlatform } from './PlatformProfiles.js'
import type { PlatformKey } from './types.js'

export type ScriptFactoryInput = {
  workspaceId: string
  contentIdeaId: string
  platform?: string
  executionId?: string
  /** test hooks */
  forceQaFail?: boolean
  forceAiFailTimes?: number
}

function scriptIdemKey(contentIdeaId: string, promptVersion: number, platform: string) {
  return `script:${contentIdeaId}:pv${promptVersion}:${platform}`
}

export class ScriptFactoryService {
  async run(input: ScriptFactoryInput) {
    const db = getDb()
    const platform = resolvePlatform(input.platform)
    const prompt = getActivePrompt('script_generator')
    const promptVersion = prompt?.version ?? 1
    const idempotencyKey = scriptIdemKey(input.contentIdeaId, promptVersion, platform)

    if (alreadyProcessed(idempotencyKey)) {
      const existing = db.prepare(`SELECT * FROM script_runs WHERE idempotency_key = ?`).get(idempotencyKey)
      return { skipped: true, reason: 'idempotent_skip', scriptRun: existing, reality: 'MOCK' as const }
    }

    const idea = db
      .prepare(`SELECT id FROM content_ideas WHERE id = ? AND workspace_id = ?`)
      .get(input.contentIdeaId, input.workspaceId)
    if (!idea) throw new Error('content_idea_not_found')

    const runId = uid()
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
      const hooksPack = generateHooks(ctx)
      const best = [...hooksPack.hooks].sort((a, b) => b.score - a.score)[0]
      const scriptPack = generateStructuredScript(ctx, best)
      const cta = generateCta(ctx, scriptPack.script.cta)
      scriptPack.script.cta = cta
      const captionPack = generateCaption(ctx, best.text)
      const visualBrief = generateVisualBrief(ctx, scriptPack.script)
      const qa = qaScript(scriptPack.script, ctx, { forceFail: input.forceQaFail })

      return { ctx, hooksPack, best, scriptPack, captionPack, visualBrief, qa }
    })

    if (!gen.ok) {
      db.prepare(
        `UPDATE script_runs SET status='FAILED', completed_at=?, error=?, provider=?, model=? WHERE id=?`,
      ).run(nowIso(), gen.failure.error, 'mock', 'gpt-4o-mini', runId)

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

      // Do not mark idempotent on FAILED — allows retry
      return {
        skipped: false,
        scriptRunId: runId,
        status: 'FAILED' as const,
        error: gen.failure.error,
        reality: 'FAILED' as const,
      }
    }

    const { hooksPack, best, scriptPack, captionPack, visualBrief, qa } = gen.value
    const tokensIn = hooksPack.tokensIn + scriptPack.tokensIn + qa.tokensIn
    const tokensOut = hooksPack.tokensOut + scriptPack.tokensOut + qa.tokensOut
    const cost =
      hooksPack.route.estimatedCostCents +
      scriptPack.route.estimatedCostCents +
      qa.route.estimatedCostCents

    recordAiCost({
      workspaceId: input.workspaceId,
      operation: 'hook_generation',
      provider: hooksPack.route.provider,
      model: hooksPack.route.model,
      inputTokens: hooksPack.tokensIn,
      outputTokens: hooksPack.tokensOut,
      estimatedCostCents: hooksPack.route.estimatedCostCents,
      contentIdeaId: input.contentIdeaId,
      scriptRunId: runId,
      reality: 'MOCK',
    })
    recordAiCost({
      workspaceId: input.workspaceId,
      operation: 'script_generation',
      provider: scriptPack.route.provider,
      model: scriptPack.route.model,
      inputTokens: scriptPack.tokensIn,
      outputTokens: scriptPack.tokensOut,
      estimatedCostCents: scriptPack.route.estimatedCostCents,
      contentIdeaId: input.contentIdeaId,
      scriptRunId: runId,
      reality: 'MOCK',
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
    // Never APPROVED on QA fail
    const qaStatus =
      qa.status === 'pass' ? 'passed' : qa.status === 'requires_review' ? 'requires_review' : 'failed'

    const scriptId = uid()
    db.prepare(
      `INSERT INTO scripts
       (id, workspace_id, idea_id, hook, body, cta, caption, hashtags, visual_brief,
        qa_status, qa_notes, reality, created_at, platform, status, quality_score, quality_breakdown,
        script_run_id, selected_hooks)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'MOCK', ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      scriptId,
      input.workspaceId,
      input.contentIdeaId,
      scriptPack.script.hook,
      JSON.stringify(scriptPack.script),
      scriptPack.script.cta,
      captionPack.caption,
      JSON.stringify(captionPack.hashtags),
      JSON.stringify(visualBrief),
      qaStatus,
      JSON.stringify(qa.notes),
      nowIso(),
      platform,
      scriptStatus,
      qa.score,
      JSON.stringify(qa.breakdown),
      runId,
      JSON.stringify(hooksPack.hooks),
    )

    emitEvent({
      workspaceId: input.workspaceId,
      eventType: 'script.created',
      entityType: 'script',
      entityId: scriptId,
      payload: { scriptRunId: runId, qaStatus, platform },
      reality: 'MOCK',
    })

    db.prepare(
      `UPDATE script_runs SET status=?, completed_at=?, model=?, provider=?, tokens_input=?, tokens_output=?,
        estimated_cost_cents=?, result=? WHERE id=?`,
    ).run(
      qa.status === 'fail' ? 'FAILED' : 'COMPLETED',
      nowIso(),
      scriptPack.route.model,
      scriptPack.route.provider,
      tokensIn,
      tokensOut,
      cost,
      JSON.stringify({
        scriptId,
        hooks: hooksPack.hooks.length,
        bestHook: best,
        qaStatus,
        scriptStatus,
      }),
      runId,
    )

    emitEvent({
      workspaceId: input.workspaceId,
      eventType: qa.status === 'fail' ? 'script.failed' : 'script.completed',
      entityType: 'script_run',
      entityId: runId,
      reality: qa.status === 'fail' ? 'FAILED' : 'MOCK',
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
      status: qa.status === 'fail' ? 'FAILED' : 'COMPLETED',
      scriptStatus,
      qaStatus,
      hooks: hooksPack.hooks,
      bestHook: best,
      script: scriptPack.script,
      caption: captionPack.caption,
      hashtags: captionPack.hashtags,
      visualBrief,
      qualityScore: qa.score,
      qualityBreakdown: qa.breakdown,
      costCents: cost,
      tokens: tokensIn + tokensOut,
      route: scriptPack.route,
      reality: 'MOCK' as const,
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
