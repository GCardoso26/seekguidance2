import type { ProductionPlan } from './types.js'
import { resolvePlatform, PLATFORM_PROFILES } from '../scriptFactory/PlatformProfiles.js'
import type { PlatformKey } from '../scriptFactory/types.js'

export type PlatformProductionProfile = ProductionPlan & { key: PlatformKey }

const BASE: Record<PlatformKey, Omit<PlatformProductionProfile, 'targetDuration' | 'key'>> = {
  YOUTUBE_SHORT: {
    platform: 'YOUTUBE_SHORT',
    aspectRatio: '9:16',
    resolution: '1080x1920',
    width: 1080,
    height: 1920,
    fps: 30,
    voice: { format: 'wav', sampleRate: 44100 },
    // Fewer, stronger frames for Ken Burns — quality over quantity.
    visual: { sceneCount: 5, assetType: 'IMAGE' },
    subtitle: { formats: ['srt', 'vtt'], burnIn: true },
    thumbnail: { width: 1080, height: 1920, format: 'jpg' },
  },
  TIKTOK: {
    platform: 'TIKTOK',
    aspectRatio: '9:16',
    resolution: '1080x1920',
    width: 1080,
    height: 1920,
    fps: 30,
    voice: { format: 'wav', sampleRate: 44100 },
    visual: { sceneCount: 5, assetType: 'IMAGE' },
    subtitle: { formats: ['srt', 'vtt'], burnIn: true },
    thumbnail: { width: 1080, height: 1920, format: 'jpg' },
  },
  INSTAGRAM_REEL: {
    platform: 'INSTAGRAM_REEL',
    aspectRatio: '9:16',
    resolution: '1080x1920',
    width: 1080,
    height: 1920,
    fps: 30,
    voice: { format: 'wav', sampleRate: 44100 },
    visual: { sceneCount: 5, assetType: 'IMAGE' },
    subtitle: { formats: ['srt', 'vtt'], burnIn: true },
    thumbnail: { width: 1080, height: 1920, format: 'jpg' },
  },
  PINTEREST: {
    platform: 'PINTEREST',
    aspectRatio: '9:16',
    resolution: '1080x1920',
    width: 1080,
    height: 1920,
    fps: 30,
    voice: { format: 'wav', sampleRate: 44100 },
    visual: { sceneCount: 5, assetType: 'IMAGE' },
    subtitle: { formats: ['srt', 'vtt'], burnIn: false },
    thumbnail: { width: 1000, height: 1500, format: 'jpg' },
  },
}

export function getProductionProfile(platformRaw?: string): PlatformProductionProfile {
  const key = resolvePlatform(platformRaw)
  const scriptProfile = PLATFORM_PROFILES[key]
  return {
    key,
    ...BASE[key],
    targetDuration: scriptProfile.targetDurationSec,
  }
}
