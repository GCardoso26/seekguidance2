import { config, systemReady } from '../config.js'
import { getDb, uid, nowIso } from '../db/client.js'
import { runDailyContentEngine, runResearchEngine } from './pipelines/dailyContentEngine.js'
import { researchService } from '../research/ResearchService.js'
import { scriptFactoryService } from '../scriptFactory/ScriptFactoryService.js'
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
  async triggerWorkflow(workflow: WorkflowKey | string, workspaceId: string, payload: Record<string, unknown> = {}) {
    const ready = systemReady()
    if (!ready.ok) {
      throw new Error(ready.reason)
    }

    if (!(workflow in WORKFLOWS) && workflow !== 'content_daily_pipeline') {
      // allow known keys only
      if (!Object.keys(WORKFLOWS).includes(workflow)) {
        throw new Error(`unknown_workflow:${workflow}`)
      }
    }

    const executionId = uid()
    const reality = config.automationMode === 'mock' ? 'MOCK' : 'PENDING'
    const id = uid()
    getDb()
      .prepare(
        `INSERT INTO automation_runs
         (id, workspace_id, workflow, execution_id, status, reality, payload, created_at)
         VALUES (?, ?, ?, ?, 'queued', ?, ?, ?)`,
      )
      .run(id, workspaceId, workflow, executionId, reality, JSON.stringify(payload), nowIso())

    // Orchestration: mock local OR n8n remote
    if (config.automationMode === 'mock' || !config.n8nBaseUrl) {
      return this.runLocal(executionId, workflow as WorkflowKey, workspaceId, payload)
    }

    return this.runRemoteN8n(executionId, workflow as WorkflowKey, workspaceId, payload)
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
          : result.scriptId
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

  getHealth(workspaceId?: string) {
    const db = getDb()
    const today = new Date().toISOString().slice(0, 10)
    const base = workspaceId
      ? db
          .prepare(
            `SELECT status, COUNT(*) as c FROM automation_runs
             WHERE workspace_id = ? AND created_at LIKE ? GROUP BY status`,
          )
          .all(workspaceId, `${today}%`)
      : db
          .prepare(
            `SELECT status, COUNT(*) as c FROM automation_runs
             WHERE created_at LIKE ? GROUP BY status`,
          )
          .all(`${today}%`)

    const counts = Object.fromEntries(
      (base as Array<{ status: string; c: number }>).map((r) => [r.status, r.c]),
    )
    const failures = workspaceId
      ? db
          .prepare(
            `SELECT COUNT(*) as c FROM automation_failures WHERE status='open' AND created_at LIKE ?`,
          )
          .get(`${today}%`)
      : db.prepare(`SELECT COUNT(*) as c FROM automation_failures WHERE status='open'`).get()

    const researchStats = workspaceId
      ? db
          .prepare(
            `SELECT status, COUNT(*) as c FROM research_runs WHERE workspace_id = ? GROUP BY status`,
          )
          .all(workspaceId)
      : []
    const scriptStats = workspaceId
      ? db
          .prepare(
            `SELECT status, COUNT(*) as c FROM script_runs WHERE workspace_id = ? GROUP BY status`,
          )
          .all(workspaceId)
      : []

    return {
      mode: config.automationMode,
      systemReady: systemReady(),
      workflows: WORKFLOWS,
      today: {
        completed: counts.completed ?? 0,
        failed: counts.failed ?? 0,
        running: counts.running ?? 0,
        queued: counts.queued ?? 0,
      },
      openFailures: (failures as { c: number }).c,
      researchRuns: researchStats,
      scriptRuns: scriptStats,
      aiCostCents: workspaceId ? sumAiCost(workspaceId) : 0,
    }
  }
}

export const automationService = new AutomationService()
