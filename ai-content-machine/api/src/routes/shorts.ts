import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { workspaceIdField } from '../lib/zodUuid.js'
import { shortsService } from '../production/ShortsService.js'
import { productionService } from '../production/ProductionService.js'
import { scriptFactoryService } from '../scriptFactory/ScriptFactoryService.js'

export async function shortsRoutes(app: FastifyInstance) {
  app.get('/api/studio/home', async (req, reply) => {
    const schema = z.object({ workspaceId: workspaceIdField })
    const parsed = schema.safeParse(req.query)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() })
    return shortsService.dashboard(parsed.data.workspaceId)
  })

  app.get('/api/health/system', async () => {
    const production = productionService.providersStatus()
    const script = scriptFactoryService.providersStatus()
    const health = shortsService.systemHealth()
    return { ...health, script, voice: production.voice, visual: production.visual }
  })

  app.post('/api/shorts', async (req, reply) => {
    const schema = z.object({
      workspaceId: workspaceIdField,
      topic: z.string().min(3).max(300),
      style: z.string().optional(),
      durationSec: z.number().min(8).max(90).optional(),
      language: z.string().optional(),
      platform: z.string().optional(),
    })
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() })
    try {
      const created = await shortsService.create(parsed.data)
      return reply.code(201).send(created)
    } catch (err) {
      const status = (err as { statusCode?: number }).statusCode || 500
      return reply.code(status).send({ error: err instanceof Error ? err.message : String(err) })
    }
  })

  app.get('/api/shorts/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const run = productionService.getRun(id)
    if (!run) return reply.code(404).send({ error: 'not_found' })
    const requests = productionService.listManualRequests(id)
    return { ...run, manualAssetRequests: requests }
  })

  app.post('/api/shorts/:id/resume', async (req, reply) => {
    const { id } = req.params as { id: string }
    try {
      return await productionService.retryStage(id, 'VISUALS')
    } catch (err) {
      return reply.code(400).send({ error: err instanceof Error ? err.message : String(err) })
    }
  })
}
