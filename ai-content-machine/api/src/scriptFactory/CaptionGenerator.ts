import { getActivePrompt } from '../services/PromptService.js'
import type { ScriptGenerationContext } from './types.js'
import { PLATFORM_PROFILES } from './PlatformProfiles.js'

export function generateCaption(ctx: ScriptGenerationContext, hook: string): {
  caption: string
  hashtags: string[]
} {
  getActivePrompt('caption_generator')
  const profile = PLATFORM_PROFILES[ctx.platform]
  const tags = ['#ia', '#produtividade', '#conteudo', '#n8n', '#rendaextra'].slice(0, profile.hashtagCount)
  return {
    caption: `${hook} ${profile.ctaStyle}.`,
    hashtags: tags,
  }
}
