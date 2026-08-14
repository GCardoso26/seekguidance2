import { getActivePrompt } from '../services/PromptService.js'
import type { ScriptGenerationContext, StructuredScript } from './types.js'

export function generateVisualBrief(ctx: ScriptGenerationContext, script: StructuredScript) {
  getActivePrompt('visual_brief_generator')
  return {
    style: 'documentary cinematic — natural light, consistent character, editorial photography',
    platform: ctx.platform,
    durationSec: ctx.targetDuration,
    shots: [
      { t: '0-3s', visual: 'hook — medium close-up of the protagonist', audio: script.hook },
      { t: '3-10s', visual: 'problem — home office setback', audio: script.problem },
      { t: '10-25s', visual: 'insight — practical demonstration', audio: script.insight },
      { t: '25-end', visual: 'CTA — calm end frame', audio: script.cta },
    ],
    endcard: ctx.offer?.name || 'AI Income Starter Kit',
  }
}
