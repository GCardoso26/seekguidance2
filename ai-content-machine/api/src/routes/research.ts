import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { researchService } from '../research/ResearchService.js'
import { automationService } from '../services/AutomationService.js'

export async function researchRoutes(app: FastifyInstance) {
  app.post('/api/research/run', async (req, reply) => {
    const schema = z.object({
      workspaceId: z.string().uuid(),
      nicheId: z.string().uuid().optional(),
      await: z.boolean().optional(),
    })
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() })

    const { workspaceId, nicheId } = parsed.data
    const shouldAwait = parsed.data.await === true
    const payload = { nicheId }

    if (shouldAwait) {
      const triggered = await automationService.triggerWorkflow('research_engine', workspaceId, payload)
      const runId =
        (triggered.result as { researchRunId?: string } | undefined)?.researchRunId ||
        (Array.isArray((triggered.result as { runs?: Array<{ researchRunId?: string }> }).runs)
          ? (triggered.result as { runs: Array<{ researchRunId?: string }> }).runs[0]?.researchRunId
          : undefined)
      return {
        executionId: triggered.executionId,
        researchRunId: runId,
        status: triggered.status,
        reality: triggered.reality,
        result: triggered.result,
      }
    }

    // Default: non-blocking — validate + enqueue + return executionId immediately
    const queued = automationService.enqueueWorkflow('research_engine', workspaceId, payload)
    return reply.code(202).send({
      executionId: queued.executionId,
      status: queued.status,
      reality: queued.reality,
      accepted: true,
    })
  })

  app.get('/api/research/runs/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const run = researchService.getRun(id)
    if (!run) return reply.code(404).send({ error: 'not_found' })
    return run
  })

  app.get('/api/research/workspaces/:workspaceId/runs', async (req) => {
    const { workspaceId } = req.params as { workspaceId: string }
    return { runs: researchService.listRuns(workspaceId) }
  })
}
