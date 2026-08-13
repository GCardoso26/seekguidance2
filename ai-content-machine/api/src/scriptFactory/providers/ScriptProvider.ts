import type { HookCandidate, ScriptGenerationContext, StructuredScript } from '../types.js'

export type ScriptProviderStatus = 'READY' | 'NOT_CONFIGURED'

export type ScriptFallbackAttempt = {
  provider: string
  model?: string
  status: ScriptProviderStatus | 'ERROR' | 'INVALID' | 'TIMEOUT'
  durationMs?: number
  error?: string
}

export type ScriptProviderResult = {
  script: StructuredScript
  hooks: HookCandidate[]
  bestHook: HookCandidate
  provider: string
  model: string
  tokensIn: number
  tokensOut: number
  durationMs: number
  estimatedCostCents?: number
  fallbackTrail: ScriptFallbackAttempt[]
}

export interface ScriptProvider {
  name: string
  status(): ScriptProviderStatus
  generate(ctx: ScriptGenerationContext): Promise<ScriptProviderResult>
}
