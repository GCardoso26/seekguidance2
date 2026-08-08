import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { automationService, WORKFLOWS, type WorkflowKey } from '../services/AutomationService.js'

const triggerSchema = z.object({
  workflow: z.string(),
  workspaceId: z.string().uuid(),
  payload: z.record(z.unknown()).optional(),
})

export async function automationRoutes(app: FastifyInstance) {
  app.get('/api/automation/health', async (req) => {
    const workspaceId = (req.query as { workspaceId?: string }).workspaceId
    return automationService.getHealth(workspaceId)
  })

  app.get('/api/automation/workflows', async () => ({ workflows: WORKFLOWS }))

  app.post('/api/automation/trigger', async (req, reply) => {
    const parsed = triggerSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'invalid_payload', details: parsed.error.flatten() })
    }
    try {
      const result = await automationService.triggerWorkflow(
        parsed.data.workflow as WorkflowKey,
        parsed.data.workspaceId,
        parsed.data.payload ?? {},
      )
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      const code = message.startsWith('SYSTEM_NOT_READY') ? 503 : 400
      return reply.code(code).send({ error: message, reality: 'FAILED' })
    }
  })

  app.get('/api/automation/executions/:executionId', async (req, reply) => {
    const { executionId } = req.params as { executionId: string }
    const row = automationService.getWorkflowStatus(executionId)
    if (!row) return reply.code(404).send({ error: 'not_found' })
    return row
  })

  app.get('/api/automation/workspaces/:workspaceId/executions', async (req) => {
    const { workspaceId } = req.params as { workspaceId: string }
    return { executions: automationService.getWorkflowExecutions(workspaceId) }
  })

  app.post('/api/automation/executions/:executionId/retry', async (req, reply) => {
    const { executionId } = req.params as { executionId: string }
    try {
      return await automationService.retryWorkflow(executionId)
    } catch (err) {
      return reply.code(400).send({ error: err instanceof Error ? err.message : String(err) })
    }
  })

  app.post('/api/automation/executions/:executionId/cancel', async (req) => {
    const { executionId } = req.params as { executionId: string }
    return automationService.cancelWorkflow(executionId)
  })
}
