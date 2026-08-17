import { ORIGINALITY_MIN, REPETITION_MAX, type OriginalityVerdict } from './types.js'
import { clamp100, jaccard } from './text.js'
import type { StructuredScript } from '../scriptFactory/types.js'
import type { ScriptGenerationContext } from '../scriptFactory/types.js'

export type OriginalityInput = {
  title?: string
  hook?: string
  cta?: string
  body?: string
  thumbnailConcept?: string
  history?: {
    titles?: string[]
    hooks?: string[]
    ctas?: string[]
    bodies?: string[]
    thumbnails?: string[]
  }
}

function collectMatches(
  kind: string,
  candidate: string | undefined,
  history: string[] | undefined,
): Array<{ kind: string; text: string; score: number }> {
  if (!candidate || !history?.length) return []
  const out: Array<{ kind: string; text: string; score: number }> = []
  for (const text of history) {
    const score = clamp100(jaccard(candidate, text) * 100)
    if (score >= 40) out.push({ kind, text: text.slice(0, 180), score })
  }
  return out.sort((a, b) => b.score - a.score).slice(0, 5)
}

export function scoreOriginality(input: OriginalityInput): OriginalityVerdict {
  const findings: string[] = []
  const matches = [
    ...collectMatches('title', input.title, input.history?.titles),
    ...collectMatches('hook', input.hook, input.history?.hooks),
    ...collectMatches('cta', input.cta, input.history?.ctas),
    ...collectMatches('script', input.body, input.history?.bodies),
    ...collectMatches('thumbnail', input.thumbnailConcept, input.history?.thumbnails),
  ]
  const repetitionScore = clamp100(matches[0]?.score || 0)
  const originalityScore = clamp100(100 - repetitionScore)
  if (repetitionScore >= REPETITION_MAX) findings.push(`repetition_above_threshold:${repetitionScore}`)
  if (originalityScore < ORIGINALITY_MIN) findings.push(`originality_below_threshold:${originalityScore}`)
  if (matches.some((m) => m.kind === 'hook' && m.score >= 80)) findings.push('hook_near_duplicate')
  if (matches.some((m) => m.kind === 'cta' && m.score >= 80)) findings.push('cta_near_duplicate')
  return {
    originalityScore,
    repetitionScore,
    reviewRequired: findings.length > 0,
    findings,
    matches,
  }
}

export function scoreOriginalityFromScript(
  script: StructuredScript,
  ctx: ScriptGenerationContext,
): OriginalityVerdict {
  return scoreOriginality({
    title: ctx.contentIdea.title,
    hook: script.hook,
    cta: script.cta,
    body: Object.values(script).join(' '),
    history: {
      titles: ctx.previousPerformance.map((p) => p.title),
      hooks: ctx.winningHooks,
      bodies: ctx.winningTopics,
    },
  })
}
