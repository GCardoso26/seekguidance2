import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import {
  bootstrapWorkspace,
  getWorkspaceSnapshot,
  startWar,
} from '../services/pipelines/dailyContentEngine.js'
import { getDb, nowIso, uid } from '../db/client.js'
import { emitEvent } from '../services/EventService.js'

export async function workspaceRoutes(app: FastifyInstance) {
  app.get('/api/workspaces', async () => {
    const rows = getDb()
      .prepare(`SELECT id, name, created_at FROM workspaces ORDER BY created_at DESC LIMIT 50`)
      .all()
    return { workspaces: rows }
  })

  app.post('/api/workspaces', async (req, reply) => {
    const schema = z.object({ name: z.string().min(2), email: z.string().email().optional() })
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() })
    try {
      const created = await bootstrapWorkspace(parsed.data)
      return created
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (/UNIQUE|unique/i.test(msg)) {
        return reply.code(409).send({
          error: 'email_already_used',
          hint: 'Reuse o workspaceId existente ou envie outro email',
        })
      }
      req.log.error(err)
      return reply.code(500).send({ error: msg })
    }
  })

  app.get('/api/workspaces/:workspaceId', async (req, reply) => {
    const { workspaceId } = req.params as { workspaceId: string }
    const snap = getWorkspaceSnapshot(workspaceId)
    if (!snap.workspace) return reply.code(404).send({ error: 'not_found' })
    return snap
  })

  app.post('/api/workspaces/:workspaceId/channels', async (req, reply) => {
    const { workspaceId } = req.params as { workspaceId: string }
    const schema = z.object({
      name: z.string(),
      platform: z.enum(['youtube', 'tiktok', 'instagram', 'pinterest']),
      face: z.enum(['A', 'B', 'C']),
    })
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send(parsed.error.flatten())
    const id = uid()
    getDb()
      .prepare(
        `INSERT INTO channels (id, workspace_id, name, platform, face, active, created_at)
         VALUES (?, ?, ?, ?, ?, 1, ?)`,
      )
      .run(id, workspaceId, parsed.data.name, parsed.data.platform, parsed.data.face, nowIso())
    return { id }
  })

  app.post('/api/workspaces/:workspaceId/niches', async (req, reply) => {
    const { workspaceId } = req.params as { workspaceId: string }
    const schema = z.object({
      name: z.string(),
      promise: z.string().optional(),
      keywords: z.array(z.string()).optional(),
    })
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send(parsed.error.flatten())
    const id = uid()
    getDb()
      .prepare(
        `INSERT INTO niches (id, workspace_id, name, promise, keywords, active, created_at)
         VALUES (?, ?, ?, ?, ?, 1, ?)`,
      )
      .run(
        id,
        workspaceId,
        parsed.data.name,
        parsed.data.promise ?? null,
        JSON.stringify(parsed.data.keywords ?? []),
        nowIso(),
      )
    return { id }
  })

  app.post('/api/workspaces/:workspaceId/war/start', async (req) => {
    const { workspaceId } = req.params as { workspaceId: string }
    const war = await startWar(workspaceId)
    emitEvent({
      workspaceId,
      eventType: 'offer.created',
      entityType: 'war',
      entityId: war.warId,
      payload: { action: 'war_started' },
      reality: 'MOCK',
    })
    return war
  })

  app.patch('/api/workspaces/:workspaceId/config', async (req, reply) => {
    const { workspaceId } = req.params as { workspaceId: string }
    const schema = z.object({
      dailyContentQty: z.number().int().min(1).max(50).optional(),
      approvalMode: z.enum(['MANUAL', 'SEMI_AUTO', 'FULL_AUTO']).optional(),
      publishingMode: z.enum(['AUTO', 'MANUAL']).optional(),
      aiBudgetCentsPerDay: z.number().int().min(0).optional(),
      paused: z.boolean().optional(),
    })
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send(parsed.error.flatten())
    const d = parsed.data
    getDb()
      .prepare(
        `UPDATE workspaces SET
          daily_content_qty = COALESCE(?, daily_content_qty),
          approval_mode = COALESCE(?, approval_mode),
          publishing_mode = COALESCE(?, publishing_mode),
          ai_budget_cents_per_day = COALESCE(?, ai_budget_cents_per_day),
          paused = COALESCE(?, paused)
         WHERE id = ?`,
      )
      .run(
        d.dailyContentQty ?? null,
        d.approvalMode ?? null,
        d.publishingMode ?? null,
        d.aiBudgetCentsPerDay ?? null,
        d.paused === undefined ? null : d.paused ? 1 : 0,
        workspaceId,
      )
    return { ok: true }
  })

  app.post('/api/contents/:contentId/approve', async (req) => {
    const { contentId } = req.params as { contentId: string }
    const body = (req.body || {}) as { forPublishing?: boolean; approvedBy?: string }
    if (body.forPublishing) {
      const at = nowIso()
      getDb()
        .prepare(
          `UPDATE contents SET status='approved', approval_required=0, updated_at=?,
           approved_for_publishing=1, approved_for_publishing_at=?, approved_by=? WHERE id=?`,
        )
        .run(at, at, body.approvedBy || 'operator', contentId)
    } else {
      getDb()
        .prepare(
          `UPDATE contents SET status='approved', approval_required=0, updated_at=? WHERE id=?`,
        )
        .run(nowIso(), contentId)
    }
    const row = getDb().prepare(`SELECT workspace_id FROM contents WHERE id=?`).get(contentId) as
      | { workspace_id: string }
      | undefined
    if (row) {
      emitEvent({
        workspaceId: row.workspace_id,
        eventType: 'content.approved',
        entityType: 'content',
        entityId: contentId,
        reality: 'MOCK',
      })
    }
    return { ok: true }
  })

  app.post('/api/contents/:contentId/reject', async (req) => {
    const { contentId } = req.params as { contentId: string }
    getDb()
      .prepare(`UPDATE contents SET status='rejected', updated_at=? WHERE id=?`)
      .run(nowIso(), contentId)
    return { ok: true }
  })
}
