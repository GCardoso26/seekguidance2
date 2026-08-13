import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { getDb, uid, nowIso } from '../db/client.js'
import { emitEvent } from '../services/EventService.js'
import { optionalUuid, workspaceIdField } from '../lib/zodUuid.js'

type TopicRow = {
  id: string
  title: string
  opportunity_score: number
}

function latestTopicWithoutIdea(workspaceId: string): TopicRow | undefined {
  return getDb()
    .prepare(
      `SELECT t.id, t.title, t.opportunity_score
       FROM topics t
       WHERE t.workspace_id = ?
         AND NOT EXISTS (SELECT 1 FROM content_ideas ci WHERE ci.topic_id = t.id)
       ORDER BY t.created_at DESC LIMIT 1`,
    )
    .get(workspaceId) as TopicRow | undefined
}

function latestTopic(workspaceId: string): TopicRow | undefined {
  return getDb()
    .prepare(
      `SELECT id, title, opportunity_score FROM topics WHERE workspace_id = ? ORDER BY created_at DESC LIMIT 1`,
    )
    .get(workspaceId) as TopicRow | undefined
}

function findIdeaByTitle(workspaceId: string, title: string) {
  return getDb()
    .prepare(`SELECT id FROM content_ideas WHERE workspace_id = ? AND title = ?`)
    .get(workspaceId, title) as { id: string } | undefined
}

function insertSelectedIdea(input: {
  workspaceId: string
  topicId: string | null
  title: string
  opportunityScore: number
}): string {
  const id = uid()
  getDb()
    .prepare(
      `INSERT INTO content_ideas
       (id, workspace_id, topic_id, title, hooks, angles, formats, opportunity_score, status, reality, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'selected', 'MOCK', ?)`,
    )
    .run(
      id,
      input.workspaceId,
      input.topicId,
      input.title,
      JSON.stringify([]),
      JSON.stringify([]),
      JSON.stringify([]),
      input.opportunityScore,
      nowIso(),
    )
  emitEvent({
    workspaceId: input.workspaceId,
    eventType: 'idea.created',
    entityType: 'idea',
    entityId: id,
    payload: { title: input.title, topicId: input.topicId },
    reality: 'MOCK',
  })
  return id
}

export async function ideaRoutes(app: FastifyInstance) {
  /**
   * Bridges the workspace/topic layer to Script Factory: creates a single
   * `content_idea` (status=selected) so `/api/scripts/generate` has a
   * contentIdeaId to work with. `title` wins when provided; otherwise falls
   * back to the given/latest topic's title.
   */
  app.post('/api/ideas', async (req, reply) => {
    const schema = z.object({
      workspaceId: workspaceIdField,
      topicId: optionalUuid,
      title: z.string().min(3).max(300).optional(),
    })
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() })
    const { workspaceId, topicId, title } = parsed.data

    const workspace = getDb().prepare(`SELECT id FROM workspaces WHERE id = ?`).get(workspaceId)
    if (!workspace) return reply.code(404).send({ error: 'workspace_not_found' })

    let resolvedTopicId: string | null = topicId ?? null
    let resolvedTitle = title
    let opportunityScore = 0.5

    if (topicId) {
      const topic = getDb()
        .prepare(`SELECT id, title, opportunity_score FROM topics WHERE id = ? AND workspace_id = ?`)
        .get(topicId, workspaceId) as TopicRow | undefined
      if (!topic) return reply.code(404).send({ error: 'topic_not_found' })
      opportunityScore = topic.opportunity_score
      if (!resolvedTitle) resolvedTitle = topic.title
    }

    if (!resolvedTitle) {
      const topic = latestTopic(workspaceId)
      if (!topic) {
        return reply.code(400).send({ error: 'title_required_no_topics_available' })
      }
      resolvedTopicId = resolvedTopicId ?? topic.id
      resolvedTitle = topic.title
      opportunityScore = topic.opportunity_score
    }

    const existing = findIdeaByTitle(workspaceId, resolvedTitle)
    if (existing) {
      return reply.code(200).send({ id: existing.id, deduped: true })
    }

    const id = insertSelectedIdea({
      workspaceId,
      topicId: resolvedTopicId,
      title: resolvedTitle,
      opportunityScore,
    })
    return reply.code(201).send({ id, topicId: resolvedTopicId, title: resolvedTitle, deduped: false })
  })

  /** Kept as an explicit alias — same semantics as POST /api/ideas without an explicit title. */
  app.post('/api/ideas/from-topic', async (req, reply) => {
    const schema = z.object({
      workspaceId: workspaceIdField,
      topicId: optionalUuid,
      title: z.string().min(3).max(300).optional(),
    })
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() })
    const { workspaceId, topicId, title } = parsed.data

    const workspace = getDb().prepare(`SELECT id FROM workspaces WHERE id = ?`).get(workspaceId)
    if (!workspace) return reply.code(404).send({ error: 'workspace_not_found' })

    let topic: TopicRow | undefined
    if (topicId) {
      topic = getDb()
        .prepare(`SELECT id, title, opportunity_score FROM topics WHERE id = ? AND workspace_id = ?`)
        .get(topicId, workspaceId) as TopicRow | undefined
      if (!topic) return reply.code(404).send({ error: 'topic_not_found' })
    } else {
      topic = latestTopicWithoutIdea(workspaceId) ?? latestTopic(workspaceId)
    }

    const resolvedTitle = title || topic?.title
    if (!resolvedTitle) return reply.code(400).send({ error: 'title_required_no_topics_available' })

    const existing = findIdeaByTitle(workspaceId, resolvedTitle)
    if (existing) return reply.code(200).send({ id: existing.id, deduped: true })

    const id = insertSelectedIdea({
      workspaceId,
      topicId: topic?.id ?? null,
      title: resolvedTitle,
      opportunityScore: topic?.opportunity_score ?? 0.5,
    })
    return reply
      .code(201)
      .send({ id, topicId: topic?.id ?? null, title: resolvedTitle, deduped: false })
  })

  /** Batch-creates ideas from research topics that don't have one yet. */
  app.post('/api/ideas/from-research', async (req, reply) => {
    const schema = z.object({
      workspaceId: workspaceIdField,
      limit: z.number().int().min(1).max(50).optional(),
    })
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() })
    const { workspaceId } = parsed.data
    const limit = parsed.data.limit ?? 5

    const workspace = getDb().prepare(`SELECT id FROM workspaces WHERE id = ?`).get(workspaceId)
    if (!workspace) return reply.code(404).send({ error: 'workspace_not_found' })

    const topics = getDb()
      .prepare(
        `SELECT t.id, t.title, t.opportunity_score
         FROM topics t
         WHERE t.workspace_id = ?
           AND NOT EXISTS (SELECT 1 FROM content_ideas ci WHERE ci.topic_id = t.id)
         ORDER BY t.created_at DESC, t.opportunity_score DESC
         LIMIT ?`,
      )
      .all(workspaceId, limit) as TopicRow[]

    const created: Array<{ id: string; topicId: string; title: string }> = []
    for (const topic of topics) {
      if (findIdeaByTitle(workspaceId, topic.title)) continue
      const id = insertSelectedIdea({
        workspaceId,
        topicId: topic.id,
        title: topic.title,
        opportunityScore: topic.opportunity_score,
      })
      created.push({ id, topicId: topic.id, title: topic.title })
    }

    return reply.code(201).send({ created, count: created.length })
  })

  app.get('/api/ideas/workspaces/:workspaceId', async (req) => {
    const { workspaceId } = req.params as { workspaceId: string }
    const ideas = getDb()
      .prepare(`SELECT * FROM content_ideas WHERE workspace_id = ? ORDER BY created_at DESC LIMIT 200`)
      .all(workspaceId)
    return { ideas }
  })
}
