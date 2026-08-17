import {
  IDEA_REVIEW_COMPOSITE_MIN,
  type IdeaScoreBreakdown,
  type ScoredIdea,
} from './types.js'
import { clamp100, countHits, maxJaccard } from './text.js'

export type IdeaScoreInput = {
  title: string
  angle?: string
  hooks?: string[]
  formats?: string[]
  audience?: string
  historyTitles?: string[]
}

const CURIOSITY = [/\?/, /\bninguém\b/i, /\bo que (ninguém|acontece|esconde)/i, /\bsegredo\b/i, /\bpor que\b/i]
const EMOTION = [/\berro\b/i, /\bperder\b/i, /\bmedo\b/i, /\btrapaça\b/i, /\bliberdade\b/i, /\bcusta\b/i]
const VISUAL = [/\b(tela|mesa|escritório|rosto|mão|cidade|rua|app|notebook)\b/i, /\bantes e depois\b/i]
const RIGHTS = [/\b(netflix|disney|marvel|fifa|uefa|spotify|eminem|taylor swift)\b/i, /\bclipe\b/i, /\bfilme\b/i]
const SHORT = [/^.{24,72}$/]

function scoreOne(input: IdeaScoreInput): IdeaScoreBreakdown {
  const blob = `${input.title} ${input.angle || ''} ${(input.hooks || []).join(' ')}`
  const curiosity = clamp100(42 + countHits(blob, CURIOSITY) * 16 + (/\d/.test(input.title) ? 8 : 0))
  const emotional_value = clamp100(40 + countHits(blob, EMOTION) * 14)
  const visual_potential = clamp100(48 + countHits(blob, VISUAL) * 18)
  const overlap = maxJaccard(input.title, input.historyTitles || [])
  const originality = clamp100(100 - overlap * 100)
  const audienceTokens = (input.audience || '').toLowerCase()
  const audience_fit = clamp100(
    audienceTokens
      ? 50 +
          (audienceTokens.includes('ia') && /ia|inteligência/i.test(blob) ? 20 : 0) +
          (audienceTokens.includes('tempo') && /tempo|hora/i.test(blob) ? 15 : 0) +
          (audienceTokens.includes('renda') && /renda|dinheiro/i.test(blob) ? 10 : 0)
      : 62,
  )
  const short_potential = clamp100(
    40 + (SHORT[0].test(input.title.trim()) ? 30 : 8) + (input.title.length <= 70 ? 15 : 0),
  )
  const rights_risk = clamp100(12 + countHits(blob, RIGHTS) * 35)
  const repetition_risk = clamp100(overlap * 100)
  return {
    curiosity,
    emotional_value,
    visual_potential,
    originality,
    audience_fit,
    short_potential,
    rights_risk,
    repetition_risk,
  }
}

export function compositeIdeaScore(scores: IdeaScoreBreakdown): number {
  return clamp100(
    (scores.curiosity +
      scores.emotional_value +
      scores.visual_potential +
      scores.originality +
      scores.audience_fit +
      scores.short_potential +
      (100 - scores.rights_risk) +
      (100 - scores.repetition_risk)) /
      8,
  )
}

export function scoreIdea(input: IdeaScoreInput): ScoredIdea {
  const scores = scoreOne(input)
  const composite = compositeIdeaScore(scores)
  return {
    title: input.title,
    angle: input.angle || 'contrarian_system',
    hooks: input.hooks?.length ? input.hooks : [input.title],
    formats: input.formats?.length ? input.formats : ['long_form', 'youtube_short'],
    scores,
    composite,
    reviewRequired:
      composite < IDEA_REVIEW_COMPOSITE_MIN || scores.rights_risk >= 70 || scores.repetition_risk >= 70,
  }
}

export function scoreIdeas(inputs: IdeaScoreInput[]): ScoredIdea[] {
  return [...inputs.map(scoreIdea)].sort((a, b) => b.composite - a.composite)
}
