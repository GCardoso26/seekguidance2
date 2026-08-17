import type { LongFormStructure, ShortStructure } from './types.js'

/** CWM canonical script sections (Script Factory). */
export type CwmScriptBody = {
  hook?: string
  setup?: string
  problem?: string
  insight?: string
  value?: string
  proof?: string
  cta?: string
}

function firstSentence(text: string, max = 180): string {
  const t = String(text || '').replace(/\s+/g, ' ').trim()
  if (!t) return ''
  const cut = t.split(/(?<=[.!?])\s+/)[0] || t
  return cut.slice(0, max)
}

/**
 * Editorial Short adapt — not a crop.
 * Maps CWM long/short script sections onto HOOK → CONTEXT → ESCALATION → PAYOFF → CTA.
 */
export function adaptScriptToShort(script: CwmScriptBody): ShortStructure {
  const hook = firstSentence(script.hook || '', 140)
  const context = firstSentence([script.setup, script.problem].filter(Boolean).join(' '), 180)
  const escalation = firstSentence([script.insight, script.value].filter(Boolean).join(' '), 180)
  const payoff = firstSentence(script.proof || script.value || '', 160)
  const cta = firstSentence(script.cta || '', 120)
  return { hook, context, escalation, payoff, cta }
}

export function adaptLongFormToShort(longForm: Partial<LongFormStructure>): ShortStructure {
  return {
    hook: firstSentence(longForm.hook || '', 140),
    context: firstSentence([longForm.context, longForm.open_loop].filter(Boolean).join(' '), 180),
    escalation: firstSentence([longForm.act_1, longForm.escalation, longForm.act_2].filter(Boolean).join(' '), 180),
    payoff: firstSentence([longForm.revelation, longForm.payoff].filter(Boolean).join(' '), 160),
    cta: firstSentence(longForm.cta || '', 120),
  }
}

export function shortToCwmBody(short: ShortStructure): CwmScriptBody {
  return {
    hook: short.hook,
    setup: short.context,
    problem: short.context,
    insight: short.escalation,
    value: short.escalation,
    proof: short.payoff,
    cta: short.cta,
  }
}

export function assertShortComplete(short: ShortStructure): string[] {
  const missing: string[] = []
  for (const key of ['hook', 'context', 'escalation', 'payoff', 'cta'] as const) {
    if (!short[key] || short[key].length < 8) missing.push(`empty_short_section:${key}`)
  }
  return missing
}
