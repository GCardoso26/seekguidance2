import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { scriptFactoryService } from '../scriptFactory/ScriptFactoryService.js'
import { automationService } from '../services/AutomationService.js'
import { getDb, nowIso } from '../db/client.js'
import { emitEvent } from '../services/EventService.js'
import { workspaceIdField } from '../lib/zodUuid.js'

export async function scriptRoutes(app: FastifyInstance) {
  app.post('/api/scripts/generate', async (req, reply) => {
    const schema = z.object({
      workspaceId: z.string().uuid(),
      contentIdeaId: z.string().uuid(),
      platform: z.string().optional(),
      await: z.boolean().optional(),
      regenerate: z.boolean().optional(),
      forceQaFail: z.boolean().optional(),
      forceAiFailTimes: z.number().int().optional(),
    })
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() })

    // A missing idea is an operator mistake, not an outage — answer 404 instead of
    // letting the workflow throw a 500 and open a dead letter.
    const idea = getDb()
      .prepare(`SELECT id FROM content_ideas WHERE id = ? AND workspace_id = ?`)
      .get(parsed.data.contentIdeaId, parsed.data.workspaceId)
    if (!idea) {
      return reply.code(404).send({
        error: 'content_idea_not_found',
        hint: 'Crie uma idea (POST /api/ideas) ou escolha uma existente no dropdown antes de gerar o script.',
      })
    }

    const payload = {
      contentIdeaId: parsed.data.contentIdeaId,
      platform: parsed.data.platform,
      regenerate: parsed.data.regenerate,
      forceQaFail: parsed.data.forceQaFail,
      forceAiFailTimes: parsed.data.forceAiFailTimes,
    }

    if (parsed.data.await === true) {
      const triggered = await automationService.triggerWorkflow(
        'script_factory',
        parsed.data.workspaceId,
        payload,
      )
      return {
        executionId: triggered.executionId,
        scriptRunId: (triggered.result as { scriptRunId?: string })?.scriptRunId,
        status: triggered.status,
        reality: triggered.reality,
        result: triggered.result,
        accepted: true,
      }
    }

    const queued = automationService.enqueueWorkflow(
      'script_factory',
      parsed.data.workspaceId,
      payload,
    )
    return reply.code(202).send({
      executionId: queued.executionId,
      status: queued.status,
      reality: queued.reality,
      accepted: true,
    })
  })

  /** Manual approval gate — required before production can run (see isScriptApproved). */
  app.post('/api/scripts/:id/approve', async (req, reply) => {
    const { id } = req.params as { id: string }
    const schema = z.object({ workspaceId: workspaceIdField })
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() })
    const { workspaceId } = parsed.data

    const db = getDb()
    const script = db
      .prepare(`SELECT id, qa_status FROM scripts WHERE id = ? AND workspace_id = ?`)
      .get(id, workspaceId) as { id: string; qa_status: string | null } | undefined
    if (!script) return reply.code(404).send({ error: 'script_not_found' })

    const qaStatus = script.qa_status === 'failed' ? script.qa_status : 'passed'
    db.prepare(`UPDATE scripts SET status='approved', qa_status=? WHERE id=?`).run(qaStatus, id)

    emitEvent({
      workspaceId,
      eventType: 'script.approved',
      entityType: 'script',
      entityId: id,
      reality: 'MOCK',
    })

    return { id, status: 'approved', qaStatus, approvedAt: nowIso() }
  })

  app.get('/api/scripts/runs/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const run = scriptFactoryService.getRun(id)
    if (!run) return reply.code(404).send({ error: 'not_found' })
    return run
  })

  app.get('/api/scripts/workspaces/:workspaceId/runs', async (req) => {
    const { workspaceId } = req.params as { workspaceId: string }
    return { runs: scriptFactoryService.listRuns(workspaceId) }
  })
}
