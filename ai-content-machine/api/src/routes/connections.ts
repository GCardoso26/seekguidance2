import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { youtubeOAuthService } from '../publishing/youtube/YouTubeOAuthService.js'
import { safetySnapshot } from '../publishing/PublishingSafety.js'
import { credentialVault } from '../credentials/CredentialVault.js'
import { youtubePublisher } from '../publishing/youtube/YouTubePublisher.js'
import { youtubeAnalyticsProvider } from '../analytics/YouTubeAnalyticsProvider.js'
import { getDb } from '../db/client.js'
import { publishingService } from '../publishing/PublishingService.js'

export async function connectionRoutes(app: FastifyInstance) {
  app.get('/api/publishing/connections', async (req) => {
    const schema = z.object({ workspaceId: z.string().uuid() })
    const parsed = schema.safeParse(req.query)
    if (!parsed.success) return { error: parsed.error.flatten() }
    const ws = parsed.data.workspaceId
    return {
      safety: safetySnapshot(),
      encryptionReady: credentialVault.encryptionReady(),
      connections: [
        {
          ...(await youtubeOAuthService.status(ws)),
          platform: 'YOUTUBE',
          publisher: youtubePublisher.status(),
          analytics: youtubeAnalyticsProvider.status(),
        },
        { platform: 'TIKTOK', status: 'NOT_CONNECTED', publisher: 'NOT_CONFIGURED' },
        { platform: 'INSTAGRAM', status: 'NOT_CONNECTED', publisher: 'NOT_CONFIGURED' },
        { platform: 'PINTEREST', status: 'NOT_CONNECTED', publisher: 'NOT_CONFIGURED' },
      ],
    }
  })

  app.post('/api/publishing/connections/youtube/start', async (req, reply) => {
    const schema = z.object({ workspaceId: z.string().uuid() })
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() })
    try {
      const started = youtubeOAuthService.start(parsed.data.workspaceId)
      return started
    } catch (err) {
      const code = (err as { code?: string }).code
      return reply.code(code === 'NOT_CONFIGURED' ? 503 : 400).send({
        error: err instanceof Error ? err.message : String(err),
        code,
      })
    }
  })

  app.get('/api/publishing/connections/youtube/callback', async (req, reply) => {
    const q = req.query as Record<string, unknown>
    // Google/browsers às vezes duplicam ?state= — normalizar para string
    const rawState = q.state
    let state = Array.isArray(rawState) ? String(rawState[0] ?? '') : String(rawState ?? '')
    const code = Array.isArray(q.code) ? String(q.code[0] ?? '') : String(q.code ?? '')
    state = state.trim().replace(/^"|"$/g, '')
    // Copy/paste do JSON do /start gruda `","state":"...` no state — recuperar hex de 48 chars
    const hexState = state.match(/^[a-f0-9]{48}/i)
    if (hexState) state = hexState[0].toLowerCase()
    if (!code || !state) {
      return reply.code(400).send({ error: 'invalid_callback', hint: 'missing code or state' })
    }
    try {
      const result = await youtubeOAuthService.callback({ code, state })
      return { ok: true, ...result }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return reply.code(400).send({
        error: message,
        hint:
          message === 'invalid_oauth_state'
            ? 'Gere um authorizeUrl novo via POST /youtube/start e abra só o campo authorizeUrl (sem colar JSON). Confira se já está CONNECTED.'
            : undefined,
        stateLen: state.length,
      })
    }
  })

  app.post('/api/publishing/connections/youtube/refresh', async (req, reply) => {
    const schema = z.object({ workspaceId: z.string().uuid() })
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() })
    const result = await youtubeOAuthService.refreshIfNeeded(parsed.data.workspaceId)
    return {
      refresh: result,
      ...youtubeOAuthService.status(parsed.data.workspaceId),
      vault: await credentialVault.status('YOUTUBE', parsed.data.workspaceId),
    }
  })

  app.delete('/api/publishing/connections/youtube', async (req, reply) => {
    const schema = z.object({ workspaceId: z.string().uuid() })
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() })
    return youtubeOAuthService.disconnect(parsed.data.workspaceId)
  })

  app.get('/api/publishing/youtube/status', async (req) => {
    const schema = z.object({ workspaceId: z.string().uuid() })
    const parsed = schema.safeParse(req.query)
    if (!parsed.success) return { error: parsed.error.flatten() }
    return {
      ...youtubeOAuthService.status(parsed.data.workspaceId),
      safety: safetySnapshot(),
      vault: await credentialVault.status('YOUTUBE', parsed.data.workspaceId),
    }
  })

  app.post('/api/publishing/approve-for-publish', async (req, reply) => {
    const schema = z.object({
      workspaceId: z.string().uuid(),
      contentId: z.string().uuid(),
      approvedBy: z.string().min(1).optional(),
    })
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() })
    const { nowIso } = await import('../db/client.js')
    const at = nowIso()
    const by = parsed.data.approvedBy || 'operator'
    const exists = getDb()
      .prepare(`SELECT id FROM contents WHERE id=? AND workspace_id=?`)
      .get(parsed.data.contentId, parsed.data.workspaceId)
    if (!exists) {
      return reply.code(404).send({
        error: 'content_not_found',
        hint: 'Use o content_id de um production run READY_FOR_PUBLISH desta workspace (não o packageId).',
      })
    }
    const validation = publishingService.validateContentPackage(
      parsed.data.contentId,
      parsed.data.workspaceId,
    )
    if (!validation.ok) {
      return reply.code(409).send({
        error: 'package_not_publishable',
        issues: validation.issues,
        hint:
          'Só conteúdos READY_FOR_PUBLISH com visuais ComfyUI/library GENERATED podem ser aprovados. Mock visual → READY_FOR_REVIEW.',
      })
    }
    const updated = getDb()
      .prepare(
        `UPDATE contents SET approved_for_publishing=1, approved_for_publishing_at=?, approved_by=?,
         status='approved', updated_at=?
         WHERE id=? AND workspace_id=?`,
      )
      .run(at, by, at, parsed.data.contentId, parsed.data.workspaceId)
    // Reporting ok:true on zero rows would let an operator believe a wrong/foreign
    // contentId was approved, then wonder why publishing stays blocked.
    if (updated.changes === 0) {
      return reply.code(404).send({
        error: 'content_not_found',
        hint: 'Use o content_id de um production run READY_FOR_PUBLISH desta workspace (não o packageId).',
      })
    }
    return { ok: true, approvedForPublishing: true, approvedAt: at, approvedBy: by }
  })
}
