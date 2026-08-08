import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { youtubeOAuthService } from '../publishing/youtube/YouTubeOAuthService.js'
import { safetySnapshot } from '../publishing/PublishingSafety.js'
import { credentialVault } from '../credentials/CredentialVault.js'
import { youtubePublisher } from '../publishing/youtube/YouTubePublisher.js'
import { youtubeAnalyticsProvider } from '../analytics/YouTubeAnalyticsProvider.js'
import { getDb } from '../db/client.js'

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
          platform: 'YOUTUBE',
          ...(await youtubeOAuthService.status(ws)),
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
    const schema = z.object({ code: z.string(), state: z.string() })
    const parsed = schema.safeParse(req.query)
    if (!parsed.success) return reply.code(400).send({ error: 'invalid_callback' })
    try {
      const result = await youtubeOAuthService.callback(parsed.data)
      // Never return tokens — redirect-style JSON for Automation Center
      return { ok: true, ...result }
    } catch (err) {
      return reply.code(400).send({ error: err instanceof Error ? err.message : String(err) })
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
    })
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() })
    const { nowIso } = await import('../db/client.js')
    getDb()
      .prepare(
        `UPDATE contents SET approved_for_publishing=1, approved_for_publishing_at=?, status='approved', updated_at=?
         WHERE id=? AND workspace_id=?`,
      )
      .run(nowIso(), nowIso(), parsed.data.contentId, parsed.data.workspaceId)
    return { ok: true, approvedForPublishing: true }
  })
}
