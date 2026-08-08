import { getDb, parseJson } from '../db/client.js'
import type { PlatformKey, ScriptGenerationContext } from './types.js'
import { PLATFORM_PROFILES } from './PlatformProfiles.js'

export function buildScriptContext(
  workspaceId: string,
  contentIdeaId: string,
  platform: PlatformKey,
): ScriptGenerationContext {
  const db = getDb()
  const idea = db
    .prepare(`SELECT * FROM content_ideas WHERE id = ? AND workspace_id = ?`)
    .get(contentIdeaId, workspaceId) as
    | {
        id: string
        title: string
        topic_id: string | null
        angles: string
        hooks: string
      }
    | undefined
  if (!idea) throw new Error('content_idea_not_found')

  const workspace = db.prepare(`SELECT * FROM workspaces WHERE id = ?`).get(workspaceId) as {
    brand_voice: string
  }
  let niche = db
    .prepare(
      `SELECT n.* FROM niches n
       JOIN topics t ON t.niche_id = n.id
       JOIN content_ideas i ON i.topic_id = t.id
       WHERE i.id = ?
       LIMIT 1`,
    )
    .get(contentIdeaId) as { id: string; name: string; promise: string | null } | undefined

  if (!niche) {
    niche = db
      .prepare(`SELECT * FROM niches WHERE workspace_id = ? AND active = 1 LIMIT 1`)
      .get(workspaceId) as { id: string; name: string; promise: string | null } | undefined
  }
  if (!niche) throw new Error('niche_not_found')

  const topic = idea.topic_id
    ? (db.prepare(`SELECT id, title FROM topics WHERE id = ?`).get(idea.topic_id) as {
        id: string
        title: string
      } | null)
    : null

  const offer = db
    .prepare(`SELECT id, name, price_cents FROM offers WHERE workspace_id = ? AND active = 1 LIMIT 1`)
    .get(workspaceId) as { id: string; name: string; price_cents: number } | undefined

  const winningHooks = (
    db
      .prepare(
        `SELECT hook FROM scripts s
         JOIN contents c ON c.script_id = s.id
         WHERE c.workspace_id = ? AND c.performance_class = 'WINNER'
         LIMIT 10`,
      )
      .all(workspaceId) as Array<{ hook: string }>
  ).map((r) => r.hook)

  const winningTopics = (
    db
      .prepare(
        `SELECT DISTINCT t.title FROM topics t
         JOIN content_ideas i ON i.topic_id = t.id
         JOIN contents c ON c.idea_id = i.id
         WHERE c.workspace_id = ? AND c.performance_class IN ('WINNER','PROMISING')
         LIMIT 10`,
      )
      .all(workspaceId) as Array<{ title: string }>
  ).map((r) => r.title)

  const previousPerformance = db
    .prepare(
      `SELECT title, COALESCE(performance_class,'NORMAL') as class, COALESCE(performance_score,0) as score
       FROM contents WHERE workspace_id = ? ORDER BY created_at DESC LIMIT 20`,
    )
    .all(workspaceId) as Array<{ title: string; class: string; score: number }>

  const angles = parseJson<string[]>(idea.angles, [])
  const profile = PLATFORM_PROFILES[platform]

  return {
    niche: { id: niche.id, name: niche.name, promise: niche.promise },
    targetAudience: 'pessoas que querem usar IA para economizar tempo e gerar renda sem aparecer',
    topic,
    contentIdea: {
      id: idea.id,
      title: idea.title,
      angles,
      hooks: parseJson<string[]>(idea.hooks, []),
    },
    angle: angles[0] || 'lista',
    brandVoice: parseJson(workspace.brand_voice, { tone: 'direto' }),
    platform,
    targetDuration: profile.targetDurationSec,
    winningHooks,
    winningTopics,
    previousPerformance,
    offer: offer ?? null,
    ctaStrategy: profile.ctaStyle,
  }
}
