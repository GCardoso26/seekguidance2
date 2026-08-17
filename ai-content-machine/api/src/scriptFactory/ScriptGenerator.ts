import { getActivePrompt } from '../services/PromptService.js'
import { resolveRouteForMode } from '../services/AiRouter.js'
import { config } from '../config.js'
import type { HookCandidate, ScriptGenerationContext, StructuredScript } from './types.js'
import { PLATFORM_PROFILES } from './PlatformProfiles.js'

export function generateStructuredScript(
  ctx: ScriptGenerationContext,
  hook: HookCandidate,
): {
  script: StructuredScript
  route: ReturnType<typeof resolveRouteForMode>
  tokensIn: number
  tokensOut: number
} {
  getActivePrompt('script_generator')
  const route = resolveRouteForMode('script_generation', config.automationMode)
  const profile = PLATFORM_PROFILES[ctx.platform]
  const offerLine = ctx.offer
    ? `Oferta: ${ctx.offer.name}.`
    : 'Oferta: kit gratuito no link.'

  const script: StructuredScript = {
    hook: hook.text,
    setup: `Em ${profile.targetDurationSec}s: ${ctx.niche.name} para ${ctx.targetAudience}.`,
    problem: `A maioria trava em “${ctx.contentIdea.title}” porque improvisa sem sistema.`,
    insight: ctx.winningTopics[0]
      ? `O histórico mostra tração em: ${ctx.winningTopics[0]}. A unidade é o roteiro, não o vídeo.`
      : 'A unidade é o roteiro, não o vídeo. 1 ideia vira 12 formatos.',
    value: `Ângulo ${ctx.angle}: transforme isso em conteúdo dark com CTA claro (${profile.ctaStyle}).`,
    proof: ctx.previousPerformance[0]
      ? `Padrão observado: ${ctx.previousPerformance[0].title} (${ctx.previousPerformance[0].class}).`
      : 'Processo testável: pesquisa → ideia → roteiro → variantes → CTA.',
    cta: `Peguei os prompts que uso e deixei no ${profile.ctaStyle}. ${offerLine}`,
  }

  return { script, route, tokensIn: 400, tokensOut: 350 }
}
