import { getActivePrompt } from '../services/PromptService.js'
import type { ScriptGenerationContext } from './types.js'
import { PLATFORM_PROFILES } from './PlatformProfiles.js'

export function generateCta(ctx: ScriptGenerationContext, baseCta: string): string {
  getActivePrompt('cta_generator')
  const profile = PLATFORM_PROFILES[ctx.platform]
  if (baseCta && baseCta.length > 8) return baseCta
  return `Peguei os prompts que uso e deixei no ${profile.ctaStyle}.`
}
