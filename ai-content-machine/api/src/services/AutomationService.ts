import { config, systemReady } from '../config.js'
import { getDb, uid, nowIso } from '../db/client.js'
import { runDailyContentEngine, runResearchEngine } from './pipelines/dailyContentEngine.js'
import { researchService } from '../research/ResearchService.js'
import { scriptFactoryService } from '../scriptFactory/ScriptFactoryService.js'
import { productionService } from '../production/ProductionService.js'
import { sumAiCost } from './AiCostService.js'

export const WORKFLOWS = {
  content_daily_pipeline: 'CWM — Daily Content Engine',
  research_engine: 'CWM — Research Engine',
  idea_generator: 'CWM — Idea Generator',
  script_factory: 'CWM — Script Factory',
  content_production: 'CWM — Content Production',
  human_approval_gate: 'CWM — Human Approval Gate',
  content_publisher: 'CWM — Content Publisher',
  analytics_sync: 'CWM — Analytics Sync',
  winner_engine: 'CWM — Winner Engine',
  content_recycling: 'CWM — Content Recycling Engine',
  monetization_engine: 'CWM — Monetization Engine',
  daily_strategy_agent: 'CWM — Daily Strategy Agent',
  war_30_day: 'CWM — 30 Day War Mode',
} as const

export type WorkflowKey = keyof typeof WORKFLOWS

export class AutomationService {
  private assertWorkflow(workflow: string): asserts workflow is WorkflowKey {
    if (!Object.keys(WORKFLOWS).includes(workflow)) {
      throw new Error(`unknown_workflow:${workflow}`)
    }
  }

  private createQueuedRun(
    workflow: WorkflowKey,
    workspaceId: string,
    payload: Record<string, unknown>,
  ): { executionId: string; reality: 'MOCK' | 'PENDING' } {
    const ready = systemReady()
    if (!ready.ok) throw new Error(ready.reason)

    const executionId = uid()
    const reality = config.automationMode === 'mock' ? 'MOCK' : 'PENDING'
    getDb()
      .prepare(
        `INSERT INTO automation_runs
         (id, workspace_id, workflow, execution_id, status, reality, payload, created_at)
         VALUES (?, ?, ?, ?, 'queued', ?, ?, ?)`,
      )
      .run(uid(), workspaceId, workflow, executionId, reality, JSON.stringify(payload), nowIso())
    return { executionId, reality }
  }

  /** Synchronous execution (tests / await:true). */
  async triggerWorkflow(workflow: WorkflowKey | string, workspaceId: string, payload: Record<string, unknown> = {}) {
    this.assertWorkflow(String(workflow))
    const { executionId } = this.createQueuedRun(workflow as WorkflowKey, workspaceId, payload)

    if (config.automationMode === 'mock' || !config.n8nBaseUrl) {
      return this.runLocal(executionId, workflow as WorkflowKey, workspaceId, payload)
    }
    return this.runRemoteN8n(executionId, workflow as WorkflowKey, workspaceId, payload)
  }

  /**
   * Non-blocking enqueue: returns executionId immediately and processes in background.
   * Use for HTTP endpoints that must not wait for long generation.
   */
  enqueueWorkflow(workflow: WorkflowKey | string, workspaceId: string, payload: Record<string, unknown> = {}) {
    this.assertWorkflow(String(workflow))
    const { executionId, reality } = this.createQueuedRun(workflow as WorkflowKey, workspaceId, payload)

    const run =
      config.automationMode === 'mock' || !config.n8nBaseUrl
        ? () => this.runLocal(executionId, workflow as WorkflowKey, workspaceId, payload)
        : () => this.runRemoteN8n(executionId, workflow as WorkflowKey, workspaceId, payload)

    setImmediate(() => {
      void run().catch((err) => {
        const message = err instanceof Error ? err.message : String(err)
        getDb()
          .prepare(
            `UPDATE automation_runs SET status='failed', finished_at=?, error=?, reality='FAILED'
             WHERE execution_id=? AND status IN ('queued','running')`,
          )
          .run(nowIso(), message, executionId)
      })
    })

    return {
      executionId,
      status: 'queued' as const,
      reality,
      accepted: true,
    }
  }

  private async runLocal(
    executionId: string,
    workflow: WorkflowKey,
    workspaceId: string,
    payload: Record<string, unknown>,
  ) {
    const started = Date.now()
    getDb()
      .prepare(`UPDATE automation_runs SET status='running', started_at=?, reality='MOCK' WHERE execution_id=?`)
      .run(nowIso(), executionId)

    try {
      let result: Record<string, unknown> = {}
      if (workflow === 'content_daily_pipeline' || workflow === 'war_30_day') {
        result = (await runDailyContentEngine(workspaceId, executionId)) as unknown as Record<
          string,
          unknown
        >
      } else if (workflow === 'research_engine') {
        if (payload.nicheId) {
          result = (await researchService.run({
            workspaceId,
            nicheId: String(payload.nicheId),
            executionId,
          })) as unknown as Record<string, unknown>
        } else {
          result = (await runResearchEngine(workspaceId, executionId)) as unknown as Record<
            string,
            unknown
          >
        }
      } else if (workflow === 'script_factory') {
        const contentIdeaId = String(payload.contentIdeaId || '')
        if (!contentIdeaId) throw new Error('contentIdeaId_required')
        result = (await scriptFactoryService.run({
          workspaceId,
          contentIdeaId,
          platform: payload.platform ? String(payload.platform) : undefined,
          executionId,
          forceQaFail: Boolean(payload.forceQaFail),
          forceAiFailTimes: Number(payload.forceAiFailTimes || 0),
        })) as unknown as Record<string, unknown>
      } else if (workflow === 'content_production') {
        const scriptId = String(payload.scriptId || '')
        if (!scriptId) throw new Error('scriptId_required')
        result = (await productionService.run({
          workspaceId,
          scriptId,
          contentId: payload.contentId ? String(payload.contentId) : undefined,
          platform: payload.platform ? String(payload.platform) : undefined,
          executionId,
          allowUnapproved: Boolean(payload.allowUnapproved),
          forceFailStage: payload.forceFailStage
            ? (String(payload.forceFailStage) as import('../production/types.js').ProductionStage)
            : undefined,
          forceFailTimes: Number(payload.forceFailTimes || 0),
          targetDurationOverride: payload.targetDurationOverride
            ? Number(payload.targetDurationOverride)
            : undefined,
          regenerate: Boolean(payload.regenerate),
        })) as unknown as Record<string, unknown>
      } else {
        // Other CWM workflows are triggered via n8n JSON in production.
        // In mock MVP we acknowledge the trigger without fabricating REAL side-effects.
        result = {
          reality: 'MOCK',
          status: 'accepted_mock',
          note: `Workflow ${workflow} registered. Full side-effects run inside content_daily_pipeline / dedicated runners.`,
          payload,
        }
      }

      const duration = Date.now() - started
      const created = (result.created as { contents?: string[] } | undefined) ?? {}
      const itemsOutput = created.contents?.length
        ? created.contents.length
        : Array.isArray(result.topicsCreated)
          ? result.topicsCreated.length
          : result.scriptId || result.productionRunId
            ? 1
            : Number(result.itemsFound ?? 0)
      const runStatus =
        result.status === 'FAILED' || result.status === 'failed'
          ? 'failed'
          : result.status === 'PARTIAL'
            ? 'completed'
            : 'completed'
      getDb()
        .prepare(
          `UPDATE automation_runs SET
            status=?, finished_at=?, duration_ms=?, items_output=?,
            tokens=?, cost_cents=?, result=?, reality=?
           WHERE execution_id=?`,
        )
        .run(
          runStatus,
          nowIso(),
          duration,
          Number(itemsOutput) || 0,
          Number(result.tokens ?? 0),
          Number(result.costCents ?? 0),
          JSON.stringify(result),
          result.reality === 'FAILED' ? 'FAILED' : 'MOCK',
          executionId,
        )

      return {
        executionId,
        status: runStatus === 'failed' ? ('failed' as const) : ('completed' as const),
        reality: (result.reality === 'FAILED' ? 'FAILED' : 'MOCK') as 'MOCK' | 'FAILED',
        result,
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      getDb()
        .prepare(
          `UPDATE automation_runs SET status='failed', finished_at=?, duration_ms=?, error=?, reality='FAILED'
           WHERE execution_id=?`,
        )
        .run(nowIso(), Date.now() - started, message, executionId)

      getDb()
        .prepare(
          `INSERT INTO automation_failures
           (id, workflow, execution_id, entity_type, entity_id, error, payload, attempts, status, created_at)
           VALUES (?, ?, ?, 'workspace', ?, ?, ?, 1, 'open', ?)`,
        )
        .run(uid(), workflow, executionId, workspaceId, message, JSON.stringify(payload), nowIso())

      throw err
    }
  }

  private async runRemoteN8n(
    executionId: string,
    workflow: WorkflowKey,
    workspaceId: string,
    payload: Record<string, unknown>,
  ) {
    const webhookPath = workflow.replace(/_/g, '-')
    const url = `${config.n8nBaseUrl.replace(/\/$/, '')}/webhook/cwm/${webhookPath}`
    getDb()
      .prepare(`UPDATE automation_runs SET status='running', started_at=?, reality='PENDING' WHERE execution_id=?`)
      .run(nowIso(), executionId)

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': config.n8nApiKey,
      },
      body: JSON.stringify({
        executionId,
        workspaceId,
        workflow,
        payload,
        callbackUrl: `${config.publicApiBase}/api/webhooks/n8n`,
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      getDb()
        .prepare(
          `UPDATE automation_runs SET status='failed', finished_at=?, error=?, reality='FAILED' WHERE execution_id=?`,
        )
        .run(nowIso(), `n8n_trigger_failed:${res.status}:${text}`, executionId)
      throw new Error(`n8n_trigger_failed:${res.status}`)
    }

    return {
      executionId,
      status: 'running' as const,
      reality: 'PENDING' as const,
      result: { accepted: true },
    }
  }

  getWorkflowStatus(executionId: string) {
    return getDb().prepare(`SELECT * FROM automation_runs WHERE execution_id = ?`).get(executionId)
  }

  getWorkflowExecutions(workspaceId: string, limit = 50) {
    return getDb()
      .prepare(
        `SELECT * FROM automation_runs WHERE workspace_id = ? ORDER BY created_at DESC LIMIT ?`,
      )
      .all(workspaceId, limit)
  }

  async retryWorkflow(executionId: string) {
    const row = getDb()
      .prepare(`SELECT * FROM automation_runs WHERE execution_id = ?`)
      .get(executionId) as
      | { workspace_id: string; workflow: string; payload: string }
      | undefined
    if (!row) throw new Error('execution_not_found')
    return this.triggerWorkflow(row.workflow, row.workspace_id, JSON.parse(row.payload || '{}'))
  }

  cancelWorkflow(executionId: string) {
    getDb()
      .prepare(
        `UPDATE automation_runs SET status='cancelled', finished_at=? WHERE execution_id=? AND status IN ('queued','running')`,
      )
      .run(nowIso(), executionId)
    return this.getWorkflowStatus(executionId)
  }

  getHealth(opts?: {
    workspaceId?: string
    window?: '24h' | '7d' | '30d'
    workflow?: string
    provider?: string
  }) {
    const db = getDb()
    const workspaceId = opts?.workspaceId
    const window = opts?.window ?? '24h'
    const sinceMs =
      window === '30d' ? 30 * 864e5 : window === '7d' ? 7 * 864e5 : 24 * 3600e3
    const since = new Date(Date.now() - sinceMs).toISOString()

    let runSql = `SELECT status, COUNT(*) as c, AVG(duration_ms) as avg_ms FROM automation_runs WHERE created_at >= ?`
    const runParams: unknown[] = [since]
    if (workspaceId) {
      runSql += ` AND workspace_id = ?`
      runParams.push(workspaceId)
    }
    if (opts?.workflow) {
      runSql += ` AND workflow = ?`
      runParams.push(opts.workflow)
    }
    runSql += ` GROUP BY status`
    const base = db.prepare(runSql).all(...runParams) as Array<{
      status: string
      c: number
      avg_ms: number | null
    }>

    const counts = Object.fromEntries(base.map((r) => [r.status, r.c]))
    const completed = counts.completed ?? 0
    const failed = counts.failed ?? 0
    const totalFinished = completed + failed
    const avgDuration = base.reduce((acc, r) => acc + (r.avg_ms || 0) * r.c, 0) / Math.max(
      base.reduce((a, r) => a + r.c, 0),
      1,
    )

    let failSql = `SELECT COUNT(*) as c, COALESCE(SUM(attempts),0) as retries FROM automation_failures WHERE created_at >= ?`
    const failParams: unknown[] = [since]
    if (opts?.workflow) {
      failSql += ` AND workflow = ?`
      failParams.push(opts.workflow)
    }
    const failures = db.prepare(failSql).get(...failParams) as { c: number; retries: number }

    let researchSql = `SELECT status, COUNT(*) as c FROM research_runs WHERE created_at >= ?`
    const researchParams: unknown[] = [since]
    if (workspaceId) {
      researchSql += ` AND workspace_id = ?`
      researchParams.push(workspaceId)
    }
    if (opts?.provider) {
      researchSql += ` AND provider LIKE ?`
      researchParams.push(`%${opts.provider}%`)
    }
    researchSql += ` GROUP BY status`

    let scriptSql = `SELECT status, COUNT(*) as c FROM script_runs WHERE created_at >= ?`
    const scriptParams: unknown[] = [since]
    if (workspaceId) {
      scriptSql += ` AND workspace_id = ?`
      scriptParams.push(workspaceId)
    }
    if (opts?.provider) {
      scriptSql += ` AND provider = ?`
      scriptParams.push(opts.provider)
    }
    scriptSql += ` GROUP BY status`

    let productionSql = `SELECT status, COUNT(*) as c FROM production_runs WHERE created_at >= ?`
    const productionParams: unknown[] = [since]
    if (workspaceId) {
      productionSql += ` AND workspace_id = ?`
      productionParams.push(workspaceId)
    }
    if (opts?.provider) {
      productionSql += ` AND reality = ?`
      productionParams.push(opts.provider)
    }
    productionSql += ` GROUP BY status`

    let productionStageSql = `SELECT current_stage as stage, COUNT(*) as c FROM production_runs WHERE created_at >= ? AND current_stage IS NOT NULL`
    const productionStageParams: unknown[] = [since]
    if (workspaceId) {
      productionStageSql += ` AND workspace_id = ?`
      productionStageParams.push(workspaceId)
    }
    productionStageSql += ` GROUP BY current_stage`

    return {
      mode: config.automationMode,
      systemReady: systemReady(),
      workflows: WORKFLOWS,
      window,
      today: {
        completed,
        failed,
        running: counts.running ?? 0,
        queued: counts.queued ?? 0,
      },
      observability: {
        successRate: totalFinished ? completed / totalFinished : 0,
        failureRate: totalFinished ? failed / totalFinished : 0,
        averageDurationMs: Math.round(avgDuration || 0),
        retryCount: failures.retries,
        dlqCount: failures.c,
        aiCostCents: workspaceId ? sumAiCost(workspaceId) : 0,
      },
      openFailures: failures.c,
      researchRuns: db.prepare(researchSql).all(...researchParams),
      scriptRuns: db.prepare(scriptSql).all(...scriptParams),
      productionRuns: db.prepare(productionSql).all(...productionParams),
      productionStages: db.prepare(productionStageSql).all(...productionStageParams),
      aiCostCents: workspaceId ? sumAiCost(workspaceId) : 0,
    }
  }
}

export const automationService = new AutomationService()
