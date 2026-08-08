import type { PlatformKey, PlatformScriptProfile } from './types.js'

export const PLATFORM_PROFILES: Record<PlatformKey, PlatformScriptProfile> = {
  YOUTUBE_SHORT: {
    key: 'YOUTUBE_SHORT',
    targetDurationSec: 40,
    ctaStyle: 'link na descrição',
    captionStyle: 'claro + busca',
    language: 'direto',
    hashtagCount: 3,
  },
  TIKTOK: {
    key: 'TIKTOK',
    targetDurationSec: 35,
    ctaStyle: 'link na bio',
    captionStyle: 'curto + tensão',
    language: 'falado',
    hashtagCount: 4,
  },
  INSTAGRAM_REEL: {
    key: 'INSTAGRAM_REEL',
    targetDurationSec: 35,
    ctaStyle: 'link na bio',
    captionStyle: 'benefício + CTA',
    language: 'limpo',
    hashtagCount: 5,
  },
  PINTEREST: {
    key: 'PINTEREST',
    targetDurationSec: 45,
    ctaStyle: 'link no pin',
    captionStyle: 'SEO leve',
    language: 'instrutivo',
    hashtagCount: 2,
  },
}

export function resolvePlatform(raw?: string): PlatformKey {
  const v = (raw || 'TIKTOK').toUpperCase()
  if (v.includes('YOUTUBE') || v === 'YOUTUBE_SHORT') return 'YOUTUBE_SHORT'
  if (v.includes('INSTAGRAM') || v.includes('REEL')) return 'INSTAGRAM_REEL'
  if (v.includes('PINTEREST') || v === 'PIN') return 'PINTEREST'
  return 'TIKTOK'
}
