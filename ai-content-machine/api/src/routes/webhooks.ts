import type { FastifyInstance } from 'fastify'
import { verifySignature } from '../lib/signature.js'
import { alreadyProcessed, markProcessed } from '../lib/idempotency.js'
import { emitEvent } from '../services/EventService.js'
import { getDb, nowIso } from '../db/client.js'

export async function webhookRoutes(app: FastifyInstance) {
  app.post('/api/webhooks/n8n', async (req, reply) => {
    const body = req.body as {
      signature?: string
      event?: string
      timestamp?: number | string
      payload?: Record<string, unknown>
      executionId?: string
    }

    const raw = JSON.stringify({
      event: body.event,
      timestamp: body.timestamp,
      payload: body.payload ?? {},
    })

    if (!body.signature || body.timestamp == null || !body.event) {
      return reply.code(401).send({ error: 'missing_auth_fields' })
    }

    const check = verifySignature(body.signature, body.timestamp, raw)
    if (!check.ok) {
      return reply.code(401).send({ error: 'unauthorized', reason: check.reason })
    }

    const eventId =
      (body.payload?.eventId as string | undefined) ||
      `n8n:${body.event}:${body.executionId ?? body.timestamp}`

    if (alreadyProcessed(eventId)) {
      return { ok: true, skipped: true, reason: 'idempotent_skip' }
    }

    emitEvent({
      workspaceId: body.payload?.workspaceId as string | undefined,
      eventType: body.event,
      entityType: body.payload?.entityType as string | undefined,
      entityId: body.payload?.entityId as string | undefined,
      payload: body.payload ?? {},
      reality: (body.payload?.reality as 'MOCK' | 'REAL' | undefined) ?? 'PENDING',
    })

    if (body.executionId && body.event === 'workflow.completed') {
      getDb()
        .prepare(
          `UPDATE automation_runs SET status='completed', finished_at=?, result=?, reality=? WHERE execution_id=?`,
        )
        .run(
          nowIso(),
          JSON.stringify(body.payload ?? {}),
          (body.payload?.reality as string) ?? 'PENDING',
          body.executionId,
        )
    }

    if (body.executionId && body.event === 'workflow.failed') {
      getDb()
        .prepare(
          `UPDATE automation_runs SET status='failed', finished_at=?, error=?, reality='FAILED' WHERE execution_id=?`,
        )
        .run(nowIso(), String(body.payload?.error ?? 'n8n_failed'), body.executionId)
    }

    markProcessed({
      eventId,
      workflow: String(body.payload?.workflow ?? 'n8n_webhook'),
      executionId: body.executionId,
      entityType: body.payload?.entityType as string | undefined,
      entityId: body.payload?.entityId as string | undefined,
    })

    return { ok: true, reality: body.payload?.reality ?? 'PENDING' }
  })
}
