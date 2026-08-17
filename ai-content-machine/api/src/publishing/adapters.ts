import type { PlatformPublisher, PublishInput } from './PlatformPublisher.js'
import type { PublicationResult, ValidationResult } from './types.js'
import { youtubePublisher } from './youtube/YouTubePublisher.js'

function notConfigured(name: string): PlatformPublisher {
  return {
    name,
    status: () => 'NOT_CONFIGURED' as const,
    async validate(_input: PublishInput): Promise<ValidationResult> {
      return { ok: false, issues: [`provider_not_configured:${name}`], requiresReview: true }
    },
    async publish(_input: PublishInput): Promise<PublicationResult> {
      throw Object.assign(new Error(`provider_not_configured:${name}`), { code: 'NOT_CONFIGURED' })
    },
    async schedule(_input: PublishInput): Promise<PublicationResult> {
      throw Object.assign(new Error(`provider_not_configured:${name}`), { code: 'NOT_CONFIGURED' })
    },
  }
}

export { youtubePublisher }
export const tiktokPublisher = notConfigured('tiktok')
export const instagramPublisher = notConfigured('instagram')
export const pinterestPublisher = notConfigured('pinterest')
