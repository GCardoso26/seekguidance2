import { getActivePrompt } from '../services/PromptService.js'
import { resolveRouteForMode } from '../services/AiRouter.js'
import { config } from '../config.js'
import type { QualityBreakdown, StructuredScript, ScriptGenerationContext } from './types.js'

export type QaResult = {
  status: 'pass' | 'requires_review' | 'fail'
  notes: string[]
  score: number
  breakdown: QualityBreakdown
  route: ReturnType<typeof resolveRouteForMode>
  tokensIn: number
  tokensOut: number
}

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)))
}

export function qaScript(
  script: StructuredScript,
  ctx: ScriptGenerationContext,
  opts?: { forceFail?: boolean },
): QaResult {
  getActivePrompt('script_qa')
  const route = resolveRouteForMode('qa', config.automationMode)
  const notes: string[] = []
  let status: QaResult['status'] = 'pass'

  const sections = ['hook', 'setup', 'problem', 'insight', 'value', 'proof', 'cta'] as const
  for (const key of sections) {
    if (!script[key] || !String(script[key]).trim()) {
      notes.push(`empty_section:${key}`)
      status = 'fail'
    }
  }

  if (!script.cta || script.cta.length < 8) {
    notes.push('missing CTA')
    status = 'fail'
  }

  if (/fique rico|ganhe milhões|sem esforço/i.test(JSON.stringify(script))) {
    notes.push('prohibited_claims')
    status = 'fail'
  }

  const joined = Object.values(script).join(' ')
  if (/(lorem ipsum|as an ai|não posso ajudar)/i.test(joined)) {
    notes.push('hallucination_markers')
    status = 'requires_review'
  }

  // crude duration estimate ~ 2.5 words/sec
  const words = joined.split(/\s+/).length
  const estSec = words / 2.5
  if (estSec < ctx.targetDuration * 0.4 || estSec > ctx.targetDuration * 2.2) {
    notes.push('duration_out_of_target')
    if (status === 'pass') status = 'requires_review'
  }

  if (opts?.forceFail) {
    notes.push('forced_qa_fail')
    status = 'requires_review'
  }

  const breakdown: QualityBreakdown = {
    hookStrength: clamp(script.hook.length > 20 ? 80 : 50),
    clarity: clamp(sections.every((k) => script[k]) ? 85 : 40),
    novelty: clamp(ctx.winningHooks.includes(script.hook) ? 45 : 75),
    retentionPotential: clamp(70 + (script.hook.includes('?') ? 5 : 0)),
    platformFit: clamp(75),
    ctaQuality: clamp(script.cta.length > 20 ? 85 : 40),
    factualRisk: notes.includes('prohibited_claims') || notes.includes('hallucination_markers') ? 20 : 80,
  }

  const score = clamp(
    (breakdown.hookStrength +
      breakdown.clarity +
      breakdown.novelty +
      breakdown.retentionPotential +
      breakdown.platformFit +
      breakdown.ctaQuality +
      breakdown.factualRisk) /
      7,
  )

  if (status === 'pass' && score < 55) status = 'requires_review'

  return { status, notes, score, breakdown, route, tokensIn: 120, tokensOut: 80 }
}
