import {
  TITLE_COMPOSITE_MIN,
  TITLE_HONESTY_MIN,
  type ScoredTitle,
  type TitleScoreBreakdown,
} from './types.js'
import { clamp100, countHits } from './text.js'

const CURIOSITY = [/\?/, /\bpor que\b/i, /\bnão te contam\b/i, /\bo erro\b/i, /\bantes que\b/i]
const SPECIFIC = [/\d/, /\b(hora|dia|semana|ferramenta|sistema|passo)\b/i]
const PROMISE = [/\b(como|sistema|método|evite|pare de)\b/i]
const EMOTION = [/\b(erro|medo|perda|caro|tarde|ninguém)\b/i]
const DISHONEST = [
  /\b(fique rico|ganhe milhões|sem esforço|garantido|100%|sempre funciona)\b/i,
  /\b(milagre|segredo da nasa)\b/i,
]

export function scoreTitle(title: string): ScoredTitle {
  const t = String(title || '').trim()
  const dishonest = countHits(t, DISHONEST) > 0
  const scores: TitleScoreBreakdown = {
    curiosity: clamp100(40 + countHits(t, CURIOSITY) * 18 + (t.includes('?') ? 8 : 0)),
    clarity: clamp100(t.length >= 24 && t.length <= 70 ? 82 : t.length < 18 ? 40 : 62),
    specificity: clamp100(38 + countHits(t, SPECIFIC) * 20),
    promise: clamp100(42 + countHits(t, PROMISE) * 16),
    emotion: clamp100(36 + countHits(t, EMOTION) * 16),
    click_potential: clamp100(45 + (t.includes('?') ? 12 : 0) + (/\d/.test(t) ? 10 : 0) + (t.length <= 64 ? 8 : 0)),
    honesty: dishonest ? 18 : clamp100(88 - (/\bvocê precisa ver\b/i.test(t) ? 20 : 0)),
  }
  const composite = clamp100(
    (scores.curiosity +
      scores.clarity +
      scores.specificity +
      scores.promise +
      scores.emotion +
      scores.click_potential +
      scores.honesty) /
      7,
  )
  return {
    title: t,
    scores,
    composite,
    dishonestClickbait: dishonest,
    reviewRequired: dishonest || scores.honesty < TITLE_HONESTY_MIN || composite < TITLE_COMPOSITE_MIN,
  }
}

export function scoreTitles(titles: string[]): ScoredTitle[] {
  const unique = [...new Set(titles.map((t) => t.trim()).filter(Boolean))]
  return unique.map(scoreTitle).sort((a, b) => b.composite - a.composite)
}

/** Generate 5–10 candidates from a seed title/angle. Never invents guaranteed-income claims. */
export function proposeTitles(seed: string, angle?: string): string[] {
  const topic = seed.replace(/[.?!]+$/g, '').trim()
  const extra = angle ? ` (${angle})` : ''
  const base = [
    `${topic}: o erro que quase ninguém admite`,
    `Por que ${topic.toLowerCase()} falha sem um sistema`,
    `O que muda quando você para de improvisar ${topic.toLowerCase()}`,
    `${topic} em 1 fluxo — sem aparecer na câmera`,
    `O detalhe específico de ${topic.toLowerCase()} que a maioria ignora`,
    `Pare de tratar ${topic.toLowerCase()} como ferramenta solta`,
    `Como ${topic.toLowerCase()} vira rotina (e o que não prometemos)`,
    `A diferença entre usar IA e ter um sistema para ${topic.toLowerCase()}`,
    `${topic}? Só se o processo for honesto${extra}`,
    `O custo silencioso de ${topic.toLowerCase()} feito no improviso`,
  ]
  return base.slice(0, 10)
}
