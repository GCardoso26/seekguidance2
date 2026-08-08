import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { publishingService } from '../publishing/PublishingService.js'
import { analyticsService } from '../analytics/AnalyticsService.js'
import { winnerDetectionService } from '../winner/WinnerDetectionService.js'
import { strategyService } from '../strategy/StrategyService.js'
import { feedbackLoopService } from '../publishing/FeedbackLoopService.js'
import { automationService } from '../services/AutomationService.js'

export async function publishingRoutes(app: FastifyInstance) {
  app.post('/api/publishing/run', async (req, reply) => {
    const schema = z.object({
      workspaceId: z.string().uuid(),
      contentId: z.string().uuid(),
      platform: z.string().optional(),
      scheduledAt: z.string().optional(),
      await: z.boolean().optional(),
      forceFailTimes: z.number().int().optional(),
      publicationVersion: z.number().int().optional(),
      feedbackLoop: z.boolean().optional(),
      scenario: z.enum(['WINNER', 'NORMAL', 'LOSER', 'INSUFFICIENT_DATA']).optional(),
    })
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() })

    const payload = {
      contentId: parsed.data.contentId,
      platform: parsed.data.platform,
      scheduledAt: parsed.data.scheduledAt,
      forceFailTimes: parsed.data.forceFailTimes,
      publicationVersion: parsed.data.publicationVersion,
      feedbackLoop: parsed.data.feedbackLoop,
      scenario: parsed.data.scenario,
    }

    if (parsed.data.await === true) {
      if (parsed.data.feedbackLoop) {
        const loop = await feedbackLoopService.run({
          workspaceId: parsed.data.workspaceId,
          contentId: parsed.data.contentId,
          platform: parsed.data.platform,
          scenario: parsed.data.scenario,
        })
        return {
          executionId: null,
          publicationRunId: loop.publicationRunId,
          status: loop.status,
          reality: 'MOCK',
          result: loop,
          accepted: true,
        }
      }
      const triggered = await automationService.triggerWorkflow(
        'content_publisher',
        parsed.data.workspaceId,
        payload,
      )
      return {
        executionId: triggered.executionId,
        publicationRunId: (triggered.result as { publicationRunId?: string })?.publicationRunId,
        status: (triggered.result as { status?: string })?.status || triggered.status,
        reality: triggered.reality,
        result: triggered.result,
        accepted: true,
      }
    }

    const queued = automationService.enqueueWorkflow(
      'content_publisher',
      parsed.data.workspaceId,
      payload,
    )
    return reply.code(202).send({
      executionId: queued.executionId,
      publicationRunId: null,
      status: 'QUEUED',
      reality: queued.reality,
      accepted: true,
    })
  })

  app.get('/api/publishing/runs/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const run = publishingService.getPublication(id)
    if (!run) return reply.code(404).send({ error: 'not_found' })
    return run
  })

  app.get('/api/publishing/workspaces/:workspaceId/runs', async (req) => {
    const { workspaceId } = req.params as { workspaceId: string }
    return { runs: publishingService.listPublications(workspaceId) }
  })

  app.post('/api/publishing/runs/:id/retry', async (req, reply) => {
    const { id } = req.params as { id: string }
    try {
      return await publishingService.retry(id)
    } catch (err) {
      return reply.code(400).send({ error: err instanceof Error ? err.message : String(err) })
    }
  })

  app.post('/api/publishing/runs/:id/cancel', async (req, reply) => {
    const { id } = req.params as { id: string }
    const run = publishingService.cancel(id)
    if (!run) return reply.code(404).send({ error: 'not_found' })
    return run
  })

  app.post('/api/analytics/sync', async (req, reply) => {
    const schema = z.object({
      workspaceId: z.string().uuid(),
      publicationId: z.string().uuid().optional(),
      contentId: z.string().uuid().optional(),
      scenario: z.enum(['WINNER', 'NORMAL', 'LOSER', 'INSUFFICIENT_DATA']).optional(),
      await: z.boolean().optional(),
      forceFailTimes: z.number().int().optional(),
    })
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() })

    if (parsed.data.await === true) {
      const triggered = await automationService.triggerWorkflow(
        'analytics_sync',
        parsed.data.workspaceId,
        parsed.data,
      )
      return { executionId: triggered.executionId, status: triggered.status, result: triggered.result }
    }
    const queued = automationService.enqueueWorkflow(
      'analytics_sync',
      parsed.data.workspaceId,
      parsed.data,
    )
    return reply.code(202).send({ executionId: queued.executionId, status: 'QUEUED', accepted: true })
  })

  app.get('/api/analytics/workspaces/:workspaceId/snapshots', async (req) => {
    const { workspaceId } = req.params as { workspaceId: string }
    return { snapshots: analyticsService.listSnapshots(workspaceId) }
  })

  app.post('/api/winners/detect', async (req, reply) => {
    const schema = z.object({
      workspaceId: z.string().uuid(),
      publicationId: z.string().uuid().optional(),
      contentId: z.string().uuid().optional(),
      await: z.boolean().optional(),
      ageHoursOverride: z.number().optional(),
    })
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() })

    if (parsed.data.await === true) {
      const triggered = await automationService.triggerWorkflow(
        'winner_engine',
        parsed.data.workspaceId,
        parsed.data,
      )
      return { executionId: triggered.executionId, status: triggered.status, result: triggered.result }
    }
    const queued = automationService.enqueueWorkflow('winner_engine', parsed.data.workspaceId, parsed.data)
    return reply.code(202).send({ executionId: queued.executionId, status: 'QUEUED', accepted: true })
  })

  app.post('/api/strategy/analyze', async (req, reply) => {
    const schema = z.object({
      workspaceId: z.string().uuid(),
      minimumEvidence: z.number().int().optional(),
      feedResearch: z.boolean().optional(),
      await: z.boolean().optional(),
    })
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() })

    if (parsed.data.await === true) {
      const triggered = await automationService.triggerWorkflow(
        'daily_strategy_agent',
        parsed.data.workspaceId,
        parsed.data,
      )
      return { executionId: triggered.executionId, status: triggered.status, result: triggered.result }
    }
    const queued = automationService.enqueueWorkflow(
      'daily_strategy_agent',
      parsed.data.workspaceId,
      parsed.data,
    )
    return reply.code(202).send({ executionId: queued.executionId, status: 'QUEUED', accepted: true })
  })

  app.get('/api/strategy/workspaces/:workspaceId/recommendations', async (req) => {
    const { workspaceId } = req.params as { workspaceId: string }
    return { recommendations: strategyService.listRecommendations(workspaceId) }
  })

  // keep unused import warning away — winner used via automation
  void winnerDetectionService
}
