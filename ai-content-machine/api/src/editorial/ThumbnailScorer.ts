import { THUMBNAIL_COMPOSITE_MIN, type ThumbnailScoreBreakdown, type ThumbnailVerdict } from './types.js'
import { clamp100, countHits } from './text.js'

export function scoreThumbnailConcept(input: {
  title: string
  concept?: string
  visualStyle?: string
}): ThumbnailVerdict {
  const concept =
    input.concept ||
    `Close-up do protagonista (character lock) à esquerda; título curto à direita; fundo documental limpo; paleta do Visual Bible.`
  const style = input.visualStyle || 'documentary_cinematic'
  const blob = `${input.title} ${concept} ${style}`
  const scores: ThumbnailScoreBreakdown = {
    clarity: clamp100(70 + (concept.length < 220 ? 10 : 0) - (/\btexto ilegível\b/i.test(concept) ? 40 : 0)),
    curiosity: clamp100(45 + countHits(input.title, [/\?/, /\berro\b/i, /\bpor que\b/i]) * 15),
    contrast: clamp100(/esquerda|direita|fundo|contraste/i.test(concept) ? 78 : 55),
    subject: clamp100(/protagonista|rosto|subject|personagem/i.test(concept) ? 82 : 50),
    emotion: clamp100(/tensão|surpresa|foco|preocup/i.test(concept) ? 72 : 58),
    composition: clamp100(/esquerda|terços|close-up|close up/i.test(concept) ? 80 : 60),
    mobile_readability: clamp100(input.title.length <= 42 ? 84 : input.title.length <= 64 ? 70 : 48),
    brand_consistency: clamp100(/visual bible|documentary|character lock|palette/i.test(blob) ? 80 : 58),
  }
  const composite = clamp100(
    Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length,
  )
  return {
    concept,
    prompt: [
      'SUBJECT: same recurring adult professional, character lock, naturalistic features',
      `ACTION: reacts to the title promise "${input.title.slice(0, 80)}"`,
      'CAMERA: medium close-up, eye-level, strong subject separation, 16:9 safe crop',
      `STYLE: ${style}, natural light, editorial photography, no text in image`,
    ].join('\n'),
    negativePrompt:
      'horror, gore, deformed eyes, deformed hands, glitch, VHS, cyberpunk, watermark, unreadable text, AI slop, deep web, extra fingers',
    scores,
    composite,
    reviewRequired: composite < THUMBNAIL_COMPOSITE_MIN,
  }
}
