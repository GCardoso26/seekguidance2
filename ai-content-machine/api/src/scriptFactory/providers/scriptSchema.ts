import { z } from 'zod'
import type { HookCandidate, StructuredScript } from '../types.js'

const hookTypes = z.enum([
  'CURIOSITY',
  'QUESTION',
  'CONTRARIAN',
  'WARNING',
  'RESULT',
  'LIST',
  'SECRET',
  'MISTAKE',
  'COMPARISON',
  'STORY',
])

const hookSchema = z.object({
  text: z.string().trim().min(8),
  type: hookTypes,
  score: z.number().min(0).max(100),
  reason: z.string().trim().min(2),
})

const scriptSchema = z.object({
  hook: z.string().trim().min(8),
  setup: z.string().trim().min(8),
  problem: z.string().trim().min(8),
  insight: z.string().trim().min(8),
  value: z.string().trim().min(8),
  proof: z.string().trim().min(8),
  cta: z.string().trim().min(8),
})

const packSchema = z.object({
  hooks: z.array(hookSchema).min(1).max(10),
  script: scriptSchema,
})

export type ValidatedScriptPack = {
  hooks: HookCandidate[]
  script: StructuredScript
  bestHook: HookCandidate
}

/** HTTP 200 ≠ válido — parse + schema antes de aceitar. */
export function parseAndValidateScriptPack(raw: unknown): ValidatedScriptPack {
  let data = raw
  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
    const jsonText = fence ? fence[1].trim() : trimmed
    try {
      data = JSON.parse(jsonText)
    } catch {
      throw Object.assign(new Error('script_payload_invalid_json'), { code: 'INVALID_SCRIPT' })
    }
  }

  const parsed = packSchema.safeParse(data)
  if (!parsed.success) {
    throw Object.assign(new Error(`script_payload_schema:${parsed.error.issues[0]?.message || 'invalid'}`), {
      code: 'INVALID_SCRIPT',
      issues: parsed.error.issues,
    })
  }

  const hooks = parsed.data.hooks as HookCandidate[]
  const bestHook = [...hooks].sort((a, b) => b.score - a.score)[0]
  const script = { ...parsed.data.script }
  // Align hook field with selected best when mismatch is soft
  if (!script.hook || script.hook.length < 8) script.hook = bestHook.text
  return { hooks, script, bestHook }
}

export function extractJsonObject(text: string): unknown {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fence ? fence[1].trim() : text.trim()
  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')
  if (start < 0 || end <= start) {
    throw Object.assign(new Error('script_payload_no_json_object'), { code: 'INVALID_SCRIPT' })
  }
  try {
    return JSON.parse(candidate.slice(start, end + 1))
  } catch {
    throw Object.assign(new Error('script_payload_invalid_json'), { code: 'INVALID_SCRIPT' })
  }
}
