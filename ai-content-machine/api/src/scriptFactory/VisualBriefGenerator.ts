import { getActivePrompt } from '../services/PromptService.js'
import type { ScriptGenerationContext, StructuredScript } from './types.js'

export function generateVisualBrief(ctx: ScriptGenerationContext, script: StructuredScript) {
  getActivePrompt('visual_brief_generator')
  return {
    style: 'dark content — screen + captions + tool B-roll',
    platform: ctx.platform,
    durationSec: ctx.targetDuration,
    shots: [
      { t: '0-3s', visual: 'hook text on screen', audio: script.hook },
      { t: '3-10s', visual: 'problem/UI fail', audio: script.problem },
      { t: '10-25s', visual: 'insight demo', audio: script.insight },
      { t: '25-end', visual: 'CTA endcard', audio: script.cta },
    ],
    endcard: ctx.offer?.name || 'AI Income Starter Kit',
  }
}
