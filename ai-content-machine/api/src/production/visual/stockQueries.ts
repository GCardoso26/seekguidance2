export type ManualAssetRequest = {
  scene_id: string
  scene_number: number
  scene_description: string
  visual_intent: string
  search_queries: string[]
  recommended_provider: 'pexels' | 'pixabay'
  required_format: '9:16'
  required_orientation: 'portrait'
  minimum_resolution: string
  suggested_duration: string
  reason: string
  pexelsUrl: string
  pixabayUrl: string
}

const ROLE_QUERIES: Record<string, string[]> = {
  hook: ['person looking at camera vertical portrait', 'close up focused adult face natural light'],
  setup: ['modern home office interior daytime', 'desk laptop clean workspace vertical'],
  problem: ['tired person working laptop night', 'exhausted worker computer late'],
  insight: ['person writing notebook at desk', 'focused professional working idea'],
  value: ['hands typing laptop productivity', 'practical workspace demonstration'],
  proof: ['checkmark success at desk', 'calm professional looking at results'],
  cta: ['person looking at camera calm end frame', 'simple desk end card vertical'],
}

function clip(text: string, max = 80): string {
  return String(text || '')
    .replace(/SUBJECT:|CAMERA:|STYLE:/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
}

/** English stock queries from scene intent — never a single literal dump of the Comfy prompt. */
export function expandStockQueries(input: {
  role?: string
  subject?: string
  environment?: string
  visualIntent?: string
  narration?: string
}): string[] {
  const role = String(input.role || 'hook')
  const extras = ROLE_QUERIES[role] || ROLE_QUERIES.hook
  const intent = clip(input.visualIntent || input.environment || '', 70)
  const subject = clip(input.subject || input.narration || '', 70)
  const out = [
    extras[0],
    extras[1],
    intent ? `${intent} vertical portrait` : '',
    subject && /[a-z]/i.test(subject) ? `${subject} 9:16` : '',
  ].filter(Boolean)
  return [...new Set(out)].slice(0, 5)
}

export function stockSearchUrls(query: string): { pexels: string; pixabay: string } {
  const q = encodeURIComponent(query)
  return {
    pexels: `https://www.pexels.com/search/${q}/`,
    pixabay: `https://pixabay.com/images/search/${q}/`,
  }
}

export function buildManualAssetRequest(input: {
  scene: number
  role?: string
  subject?: string
  visualIntent?: string
  narration?: string
  durationSec?: number
  reason: string
}): ManualAssetRequest {
  const queries = expandStockQueries(input)
  const primary = queries[0] || 'tired person working night laptop'
  const urls = stockSearchUrls(primary)
  const dur = Math.max(3, Math.round(Number(input.durationSec) || 5))
  return {
    scene_id: `S${String(input.scene).padStart(2, '0')}`,
    scene_number: input.scene,
    scene_description: clip(input.visualIntent || input.subject || input.narration || '', 180),
    visual_intent: clip(input.visualIntent || input.role || 'editorial stock', 120),
    search_queries: queries,
    recommended_provider: 'pexels',
    required_format: '9:16',
    required_orientation: 'portrait',
    minimum_resolution: '1080x1920',
    suggested_duration: `${dur}-${dur + 2} seconds`,
    reason: input.reason,
    pexelsUrl: urls.pexels,
    pixabayUrl: urls.pixabay,
  }
}
