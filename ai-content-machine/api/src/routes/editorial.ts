import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import os from 'node:os'
import path from 'node:path'
import { workspaceIdField, optionalUuid } from '../lib/zodUuid.js'
import { getDb } from '../db/client.js'
import { productionService } from '../production/ProductionService.js'
import { scoreIdeas } from '../editorial/IdeaScorer.js'
import { proposeTitles, scoreTitles } from '../editorial/TitleScorer.js'
import { scoreOriginality } from '../editorial/OriginalityService.js'
import { evaluateRights } from '../editorial/RightsGate.js'
import { scoreThumbnailConcept } from '../editorial/ThumbnailScorer.js'
import { adaptLongFormToShort, adaptScriptToShort, assertShortComplete } from '../editorial/ShortAdapter.js'
import { planEditorialDryRun } from '../editorial/EditorialDryRun.js'
import { buildEditorialPackage } from '../editorial/EditorialPackageBuilder.js'
import type { ProductionStage } from '../production/types.js'

export async function editorialRoutes(app: FastifyInstance) {
  app.post('/api/editorial/ideas/score', async (req, reply) => {
    const schema = z.object({
      audience: z.string().optional(),
      historyTitles: z.array(z.string()).optional(),
      ideas: z
        .array(
          z.object({
            title: z.string().min(3),
            angle: z.string().optional(),
            hooks: z.array(z.string()).optional(),
            formats: z.array(z.string()).optional(),
          }),
        )
        .min(1)
        .max(20),
    })
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() })
    const ranked = scoreIdeas(
      parsed.data.ideas.map((i) => ({ ...i, audience: parsed.data.audience, historyTitles: parsed.data.historyTitles })),
    )
    return { ideas: ranked }
  })

  app.post('/api/editorial/titles/score', async (req, reply) => {
    const schema = z.object({
      seed: z.string().min(3).optional(),
      angle: z.string().optional(),
      titles: z.array(z.string()).max(12).optional(),
    })
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() })
    const titles = parsed.data.titles?.length
      ? parsed.data.titles
      : proposeTitles(parsed.data.seed || 'sistema de IA faceless', parsed.data.angle)
    return { titles: scoreTitles(titles) }
  })

  app.post('/api/editorial/originality', async (req, reply) => {
    const schema = z.object({
      workspaceId: workspaceIdField.optional(),
      title: z.string().optional(),
      hook: z.string().optional(),
      cta: z.string().optional(),
      body: z.string().optional(),
      history: z
        .object({
          titles: z.array(z.string()).optional(),
          hooks: z.array(z.string()).optional(),
          ctas: z.array(z.string()).optional(),
          bodies: z.array(z.string()).optional(),
        })
        .optional(),
    })
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() })
    let history = parsed.data.history || {}
    if (parsed.data.workspaceId) {
      const rows = getDb()
        .prepare(
          `SELECT title, COALESCE(performance_class,'NORMAL') as class FROM contents WHERE workspace_id=? ORDER BY created_at DESC LIMIT 40`,
        )
        .all(parsed.data.workspaceId) as Array<{ title: string }>
      const hooks = getDb()
        .prepare(`SELECT hook FROM scripts WHERE workspace_id=? ORDER BY created_at DESC LIMIT 40`)
        .all(parsed.data.workspaceId) as Array<{ hook: string }>
      history = {
        titles: [...(history.titles || []), ...rows.map((r) => r.title)],
        hooks: [...(history.hooks || []), ...hooks.map((h) => h.hook)],
        ctas: history.ctas,
        bodies: history.bodies,
      }
    }
    return scoreOriginality({ ...parsed.data, history })
  })

  app.post('/api/editorial/rights', async (req, reply) => {
    const schema = z.object({
      claimedCredits: z.array(z.string()).optional(),
      inventCredits: z.boolean().optional(),
      assets: z
        .array(
          z.object({
            license: z.string().optional(),
            source_type: z.string().optional(),
            type: z.string().optional(),
            provider: z.string().optional(),
          }),
        )
        .optional(),
    })
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() })
    return evaluateRights(parsed.data)
  })

  app.post('/api/editorial/thumbnail/score', async (req, reply) => {
    const schema = z.object({
      title: z.string().min(3),
      concept: z.string().optional(),
      visualStyle: z.string().optional(),
    })
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() })
    return scoreThumbnailConcept(parsed.data)
  })

  app.post('/api/editorial/shorts/adapt', async (req, reply) => {
    const schema = z.object({
      script: z
        .object({
          hook: z.string().optional(),
          setup: z.string().optional(),
          problem: z.string().optional(),
          insight: z.string().optional(),
          value: z.string().optional(),
          proof: z.string().optional(),
          cta: z.string().optional(),
        })
        .optional(),
      longForm: z
        .object({
          hook: z.string().optional(),
          context: z.string().optional(),
          open_loop: z.string().optional(),
          act_1: z.string().optional(),
          escalation: z.string().optional(),
          act_2: z.string().optional(),
          revelation: z.string().optional(),
          act_3: z.string().optional(),
          payoff: z.string().optional(),
          cta: z.string().optional(),
        })
        .optional(),
    })
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() })
    const short = parsed.data.longForm
      ? adaptLongFormToShort(parsed.data.longForm)
      : adaptScriptToShort(parsed.data.script || {})
    return { short, missing: assertShortComplete(short), crop: false }
  })

  app.post('/api/editorial/dry-run', async (req, reply) => {
    const schema = z.object({
      productionId: optionalUuid,
      includeEditorial: z.boolean().optional(),
    })
    const parsed = schema.safeParse(req.body ?? {})
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() })
    let existing: Partial<Record<ProductionStage, { ok?: boolean; provider?: string }>> = {}
    if (parsed.data.productionId) {
      const run = productionService.getRun(parsed.data.productionId) as
        | { result?: unknown; assets?: unknown[] }
        | null
      const result = run?.result
      try {
        const parsedResult = JSON.parse(String(result || '{}')) as {
          stages?: Record<string, { ok?: boolean; provider?: string }>
        }
        existing = (parsedResult.stages || {}) as typeof existing
      } catch {
        existing = {}
      }
    }
    return planEditorialDryRun({ existingStages: existing, includeEditorial: parsed.data.includeEditorial })
  })

  app.post('/api/editorial/package', async (req, reply) => {
    const schema = z.object({
      channel: z.record(z.unknown()),
      research: z.record(z.unknown()).optional(),
      idea: z.record(z.unknown()).optional(),
      scriptMd: z.string().optional(),
      storyboard: z.unknown().optional(),
      visualBible: z.string().optional(),
      visualPrompts: z.unknown().optional(),
      metadata: z.record(z.unknown()).optional(),
      credits: z.array(z.string()).optional(),
      assets: z.array(z.record(z.unknown())).optional(),
      productionId: optionalUuid,
      contentId: optionalUuid,
      version: z.number().int().optional(),
      outputDir: z.string().optional(),
    })
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() })
    const outputDir =
      parsed.data.outputDir || path.join(os.tmpdir(), `cwm-editorial-${Date.now()}`)
    const assets = [...(parsed.data.assets || [])]
    if (parsed.data.productionId) {
      const run = productionService.getRun(parsed.data.productionId) as { assets?: unknown[] } | null
      if (run?.assets && Array.isArray(run.assets)) {
        assets.push(...(run.assets as Array<Record<string, unknown>>))
      }
    }
    return buildEditorialPackage({ ...parsed.data, outputDir, assets })
  })
}
