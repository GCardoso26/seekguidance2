import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { productionService } from '../production/ProductionService.js'
import { automationService } from '../services/AutomationService.js'
import type { ProductionStage } from '../production/types.js'
import { optionalUuid, workspaceIdField } from '../lib/zodUuid.js'

export async function productionRoutes(app: FastifyInstance) {
  app.post('/api/production/run', async (req, reply) => {
    const schema = z.object({
      workspaceId: workspaceIdField,
      scriptId: z.string().uuid(),
      contentId: optionalUuid,
      platform: z.string().optional(),
      await: z.boolean().optional(),
      allowUnapproved: z.boolean().optional(),
      forceFailStage: z.string().optional(),
      forceFailTimes: z.number().int().optional(),
      targetDurationOverride: z.number().optional(),
      regenerate: z.boolean().optional(),
    })
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() })

    const payload = {
      scriptId: parsed.data.scriptId,
      contentId: parsed.data.contentId,
      platform: parsed.data.platform,
      allowUnapproved: parsed.data.allowUnapproved,
      forceFailStage: parsed.data.forceFailStage,
      forceFailTimes: parsed.data.forceFailTimes,
      targetDurationOverride: parsed.data.targetDurationOverride,
      regenerate: parsed.data.regenerate,
    }

    if (parsed.data.await === true) {
      const triggered = await automationService.triggerWorkflow(
        'content_production',
        parsed.data.workspaceId,
        payload,
      )
      return {
        executionId: triggered.executionId,
        productionRunId: (triggered.result as { productionRunId?: string })?.productionRunId,
        status: (triggered.result as { status?: string })?.status || triggered.status,
        reality: triggered.reality,
        result: triggered.result,
        accepted: true,
      }
    }

    const queued = automationService.enqueueWorkflow(
      'content_production',
      parsed.data.workspaceId,
      payload,
    )
    return reply.code(202).send({
      executionId: queued.executionId,
      productionRunId: null,
      status: 'QUEUED',
      reality: queued.reality,
      accepted: true,
    })
  })

  app.get('/api/production/runs/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const run = productionService.getRun(id)
    if (!run) return reply.code(404).send({ error: 'not_found' })
    return run
  })

  app.get('/api/production/workspaces/:workspaceId/runs', async (req) => {
    const { workspaceId } = req.params as { workspaceId: string }
    return { runs: productionService.listRuns(workspaceId) }
  })

  app.post('/api/production/runs/:id/retry', async (req, reply) => {
    const { id } = req.params as { id: string }
    const schema = z.object({ stage: z.string().optional() })
    const parsed = schema.safeParse(req.body ?? {})
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() })
    try {
      const result = await productionService.retryStage(
        id,
        parsed.data.stage as ProductionStage | undefined,
      )
      return result
    } catch (err) {
      return reply.code(400).send({ error: err instanceof Error ? err.message : String(err) })
    }
  })

  app.post('/api/production/runs/:id/cancel', async (req, reply) => {
    const { id } = req.params as { id: string }
    const run = productionService.cancelRun(id)
    if (!run) return reply.code(404).send({ error: 'not_found' })
    return run
  })

  app.post('/api/production/runs/:id/regenerate/:stage', async (req, reply) => {
    const { id, stage } = req.params as { id: string; stage: string }
    try {
      const result = await productionService.regenerate(id, stage)
      return result
    } catch (err) {
      return reply.code(400).send({ error: err instanceof Error ? err.message : String(err) })
    }
  })

  app.get('/api/production/:contentId/assets', async (req) => {
    const { contentId } = req.params as { contentId: string }
    return { assets: productionService.listAssetsByContent(contentId) }
  })
}
