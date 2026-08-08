import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { productionPreflightService } from '../validation/ProductionPreflightService.js'
import { dryRunReportService } from '../validation/DryRunReportService.js'
import { experimentService } from '../validation/ExperimentService.js'
import {
  openPublishWindow,
  restoreSafetyDefaults,
  isSafetyDefaultState,
} from '../validation/SafetyDefaults.js'
import { safetySnapshot } from '../publishing/PublishingSafety.js'

export async function validationRoutes(app: FastifyInstance) {
  app.get('/api/validation/preflight', async (req) => {
    const schema = z.object({
      workspaceId: z.string().uuid(),
      contentId: z.string().uuid().optional(),
    })
    const parsed = schema.safeParse(req.query)
    if (!parsed.success) return { error: parsed.error.flatten() }
    return productionPreflightService.run(parsed.data)
  })

  app.post('/api/validation/dry-run-report', async (req, reply) => {
    const schema = z.object({
      workspaceId: z.string().uuid(),
      contentId: z.string().uuid(),
      platform: z.string().optional(),
      scheduledAt: z.string().optional(),
      publicationVersion: z.number().int().optional(),
    })
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() })
    const report = await dryRunReportService.build(parsed.data)
    // Hard guarantee: never claim upload
    return { ...report, wouldUpload: false as const }
  })

  app.get('/api/validation/safety', async () => ({
    snapshot: safetySnapshot(),
    isDefaultSafe: isSafetyDefaultState(),
  }))

  app.post('/api/validation/safety/restore-defaults', async () => restoreSafetyDefaults())

  app.post('/api/validation/safety/open-window', async (req, reply) => {
    const schema = z.object({
      confirm: z.literal('OPEN_PUBLISH_WINDOW'),
      maxPublicationsPerDay: z.number().int().min(1).max(1).optional(),
    })
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'confirmation_required',
        hint: 'Body must include confirm: OPEN_PUBLISH_WINDOW and maxPublicationsPerDay<=1',
      })
    }
    return openPublishWindow({ maxPublicationsPerDay: parsed.data.maxPublicationsPerDay ?? 1 })
  })

  app.post('/api/validation/experiments', async (req, reply) => {
    const schema = z.object({
      workspaceId: z.string().uuid(),
      contentId: z.string().uuid().optional(),
      platform: z.string().optional(),
      objective: z.string().optional(),
      hypothesis: z.string().optional(),
      notes: z.string().optional(),
    })
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() })
    return experimentService.create(parsed.data)
  })

  app.get('/api/validation/experiments', async (req) => {
    const schema = z.object({ workspaceId: z.string().uuid() })
    const parsed = schema.safeParse(req.query)
    if (!parsed.success) return { error: parsed.error.flatten() }
    return { experiments: experimentService.list(parsed.data.workspaceId) }
  })

  app.get('/api/validation/experiments/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const exp = experimentService.get(id)
    if (!exp) return reply.code(404).send({ error: 'not_found' })
    return exp
  })

  app.post('/api/validation/experiments/:id/preflight', async (req, reply) => {
    const { id } = req.params as { id: string }
    try {
      return await experimentService.runPreflight(id)
    } catch (err) {
      return reply.code(400).send({ error: err instanceof Error ? err.message : String(err) })
    }
  })

  app.post('/api/validation/experiments/:id/dry-run', async (req, reply) => {
    const { id } = req.params as { id: string }
    try {
      return await experimentService.runDryRun(id)
    } catch (err) {
      return reply.code(400).send({ error: err instanceof Error ? err.message : String(err) })
    }
  })

  app.post('/api/validation/experiments/:id/approve', async (req, reply) => {
    const { id } = req.params as { id: string }
    const schema = z.object({ approvedBy: z.string().min(1) })
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() })
    try {
      return experimentService.approve(id, parsed.data.approvedBy)
    } catch (err) {
      return reply.code(400).send({ error: err instanceof Error ? err.message : String(err) })
    }
  })

  app.post('/api/validation/experiments/:id/attach-publication', async (req, reply) => {
    const { id } = req.params as { id: string }
    const schema = z.object({ publicationId: z.string().uuid() })
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() })
    try {
      return experimentService.attachPublication(id, parsed.data.publicationId)
    } catch (err) {
      return reply.code(400).send({ error: err instanceof Error ? err.message : String(err) })
    }
  })

  app.post('/api/validation/experiments/:id/observe', async (req, reply) => {
    const { id } = req.params as { id: string }
    try {
      return await experimentService.observe(id)
    } catch (err) {
      return reply.code(400).send({ error: err instanceof Error ? err.message : String(err) })
    }
  })

  app.post('/api/validation/experiments/:id/analyze', async (req, reply) => {
    const { id } = req.params as { id: string }
    try {
      return await experimentService.analyze(id)
    } catch (err) {
      return reply.code(400).send({ error: err instanceof Error ? err.message : String(err) })
    }
  })

  app.post('/api/validation/experiments/:id/complete', async (req, reply) => {
    const { id } = req.params as { id: string }
    const schema = z.object({ notes: z.string().optional() })
    const parsed = schema.safeParse(req.body || {})
    try {
      return experimentService.complete(id, parsed.success ? parsed.data.notes : undefined)
    } catch (err) {
      return reply.code(400).send({ error: err instanceof Error ? err.message : String(err) })
    }
  })
}
