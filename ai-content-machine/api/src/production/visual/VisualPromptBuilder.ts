/**
 * Structured positive prompt — WHAT vs HOW stay separated in the text
 * the diffusion model actually sees.
 */
export function buildScenePrompt(input: {
  subject: string
  action: string
  environment: string
  camera: string
  lighting: string
  style: string
  mood: string
  quality: string
  characterLock: string
  palette?: string
}): string {
  const lines = [
    `SUBJECT: ${clean(input.subject)}`,
    `ACTION: ${clean(input.action)}`,
    `ENVIRONMENT: ${clean(input.environment)}`,
    `CHARACTER LOCK: ${clean(input.characterLock)}`,
    `CAMERA: ${clean(input.camera)}`,
    `LIGHTING: ${clean(input.lighting)}`,
    `STYLE: ${clean(input.style)}`,
    `MOOD: ${clean(input.mood)}`,
    `PALETTE: ${clean(input.palette || 'muted clean neutrals')}`,
    `QUALITY: ${clean(input.quality)}, vertical 9:16 frame, sharp subject, no on-image text`,
  ]
  return lines.join('\n')
}

function clean(s: string): string {
  return String(s || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 280)
}
