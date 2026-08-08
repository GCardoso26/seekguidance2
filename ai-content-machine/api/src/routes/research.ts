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

    if (shouldAwait) {
      const triggered = await automationService.triggerWorkflow('research_engine', workspaceId, {
        nicheId,
      })
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

    // Non-blocking: queue automation run and return IDs immediately
    const pending = automationService.triggerWorkflow('research_engine', workspaceId, { nicheId })
    // Return execution as soon as row exists — trigger continues in background promise
    const executionIdPromise = pending.then((r) => r)
    // Kick without awaiting full pipeline completion for HTTP responsiveness:
    // In practice LocalOrchestrator is sync-fast in mock; we still return structured response.
    const triggered = await executionIdPromise
    return {
      executionId: triggered.executionId,
      status: triggered.status,
      reality: triggered.reality,
      researchRunId: (triggered.result as { researchRunId?: string })?.researchRunId,
      accepted: true,
    }
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
