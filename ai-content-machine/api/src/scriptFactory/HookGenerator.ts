import { getActivePrompt } from '../services/PromptService.js'
import { resolveRouteForMode } from '../services/AiRouter.js'
import { config } from '../config.js'
import type { HookCandidate, HookType, ScriptGenerationContext } from './types.js'

const TYPES: HookType[] = [
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
]

export function generateHooks(ctx: ScriptGenerationContext): {
  hooks: HookCandidate[]
  route: ReturnType<typeof resolveRouteForMode>
  tokensIn: number
  tokensOut: number
} {
  getActivePrompt('hook_generator')
  const route = resolveRouteForMode('hook_generation', config.automationMode)
  const topic = ctx.contentIdea.title
  const winBoost = ctx.winningHooks[0] ? 8 : 0

  const templates: Array<{ type: HookType; text: string; reason: string; base: number }> = [
    { type: 'CURIOSITY', text: `Ninguém te mostrou isso sobre ${topic}.`, reason: 'curiosidade específica', base: 78 },
    { type: 'QUESTION', text: `Por que ${topic} ainda consome suas horas?`, reason: 'pergunta com dor', base: 74 },
    { type: 'CONTRARIAN', text: `Pare de fazer ${topic} do jeito “certo”.`, reason: 'contrarian suave', base: 80 },
    { type: 'WARNING', text: `Esse erro em ${topic} mata sua retenção.`, reason: 'alerta acionável', base: 76 },
    { type: 'RESULT', text: `De ideia a 30 conteúdos com ${topic}.`, reason: 'resultado concreto', base: 82 },
    { type: 'LIST', text: `3 atalhos de ${topic} que parecem mentira.`, reason: 'lista rápida', base: 79 },
    { type: 'SECRET', text: `O prompt escondido por trás de ${topic}.`, reason: 'segredo tático', base: 73 },
    { type: 'MISTAKE', text: `Você está usando IA errado em ${topic}.`, reason: 'erro comum', base: 85 },
    { type: 'COMPARISON', text: `${topic}: ChatGPT vs Claude na prática.`, reason: 'comparativo', base: 77 },
    { type: 'STORY', text: `Eu parei de improvisar ${topic} — e o link começou a vender.`, reason: 'mini história', base: 81 },
  ]

  const hooks = templates.slice(0, 5).map((t, i) => {
    const type = TYPES[i] || t.type
    const score = Math.min(100, t.base + winBoost - i)
    return {
      text: t.text,
      type,
      score,
      reason: t.reason,
    }
  })

  return { hooks, route, tokensIn: 220, tokensOut: 180 }
}
