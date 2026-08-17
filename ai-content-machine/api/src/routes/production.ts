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

    // Answer the approval gate here rather than letting ProductionService throw: a
    // throw inside the workflow becomes a 500 plus an open dead letter, which reads
    // like an outage instead of "approve the script first".
    if (!parsed.data.allowUnapproved) {
      const eligibility = productionService.checkScriptEligibility(
        parsed.data.workspaceId,
        parsed.data.scriptId,
      )
      if (!eligibility.ok && eligibility.code === 'script_not_found') {
        return reply.code(404).send({
          error: 'script_not_found',
          hint: 'Rode o Script Factory para esta idea e selecione o script gerado.',
        })
      }
      if (!eligibility.ok) {
        return reply.code(409).send({
          error: 'script_not_approved',
          scriptStatus: eligibility.scriptStatus,
          qaStatus: eligibility.qaStatus,
          hint:
            `Script está status=${eligibility.scriptStatus}/qa_status=${eligibility.qaStatus}. ` +
            'Production só aceita approved ou (ready + qa_status=passed). ' +
            'Use POST /api/scripts/:id/approve (botão "Approve Script") antes de produzir.',
          nextAction: 'approve_script',
        })
      }
    }

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

  app.post('/api/production/runs/:id/scenes/:scene/upload', async (req, reply) => {
    const { id, scene } = req.params as { id: string; scene: string }
    const schema = z.object({
      imageBase64: z.string().min(16),
      filename: z.string().optional(),
      workspaceId: z.string().uuid().optional(),
    })
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() })
    const raw = parsed.data.imageBase64.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(raw, 'base64')
    if (buffer.length < 32) return reply.code(400).send({ error: 'invalid_image' })
    try {
      const result = await productionService.attachSceneAsset({
        productionId: id,
        scene: Number(scene),
        buffer,
        filename: parsed.data.filename,
        workspaceId: parsed.data.workspaceId,
      })
      return result
    } catch (err) {
      return reply.code(400).send({ error: err instanceof Error ? err.message : String(err) })
    }
  })
}
