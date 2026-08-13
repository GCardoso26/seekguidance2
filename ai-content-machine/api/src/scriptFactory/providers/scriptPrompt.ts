import type { ScriptGenerationContext } from '../types.js'

export function buildScriptLlmMessages(ctx: ScriptGenerationContext): Array<{ role: string; content: string }> {
  const system = `Você é roteirista dark da NEXUS/CWM.
Responda APENAS com JSON válido (sem markdown) no formato:
{
  "hooks": [{"text":"...","type":"CURIOSITY|QUESTION|CONTRARIAN|WARNING|RESULT|LIST|SECRET|MISTAKE|COMPARISON|STORY","score":0-100,"reason":"..."}],
  "script": {"hook":"...","setup":"...","problem":"...","insight":"...","value":"...","proof":"...","cta":"..."}
}
Regras: português BR, CTA claro (link na bio / oferta), sem claims proibidos de renda garantida, 1-5 hooks.`

  const user = JSON.stringify(
    {
      niche: ctx.niche.name,
      audience: ctx.targetAudience,
      idea: ctx.contentIdea.title,
      angle: ctx.angle,
      platform: ctx.platform,
      targetDurationSec: ctx.targetDuration,
      offer: ctx.offer?.name ?? null,
      ctaStrategy: ctx.ctaStrategy,
      winningHooks: ctx.winningHooks.slice(0, 3),
      winningTopics: ctx.winningTopics.slice(0, 3),
    },
    null,
    0,
  )

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ]
}
