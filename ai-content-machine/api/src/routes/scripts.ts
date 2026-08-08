import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { scriptFactoryService } from '../scriptFactory/ScriptFactoryService.js'
import { automationService } from '../services/AutomationService.js'

export async function scriptRoutes(app: FastifyInstance) {
  app.post('/api/scripts/generate', async (req, reply) => {
    const schema = z.object({
      workspaceId: z.string().uuid(),
      contentIdeaId: z.string().uuid(),
      platform: z.string().optional(),
      await: z.boolean().optional(),
      forceQaFail: z.boolean().optional(),
      forceAiFailTimes: z.number().int().optional(),
    })
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() })

    const triggered = await automationService.triggerWorkflow(
      'script_factory',
      parsed.data.workspaceId,
      {
        contentIdeaId: parsed.data.contentIdeaId,
        platform: parsed.data.platform,
        forceQaFail: parsed.data.forceQaFail,
        forceAiFailTimes: parsed.data.forceAiFailTimes,
      },
    )

    return {
      executionId: triggered.executionId,
      scriptRunId: (triggered.result as { scriptRunId?: string })?.scriptRunId,
      status: triggered.status,
      reality: triggered.reality,
      result: triggered.result,
      accepted: true,
    }
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
