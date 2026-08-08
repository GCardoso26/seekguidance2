import type { PlatformPublisher, PublishInput } from './PlatformPublisher.js'
import type { PublicationResult, ValidationResult } from './types.js'

/**
 * Explicit MOCK publisher — never claims REAL platform success.
 */
export class MockPublisher implements PlatformPublisher {
  name = 'mock_publisher'

  status() {
    return 'READY' as const
  }

  async validate(input: PublishInput): Promise<ValidationResult> {
    const issues: string[] = []
    if (!input.contentId) issues.push('missing_content')
    if (!input.metadata.title?.trim()) issues.push('missing_title')
    if (!input.videoUri) issues.push('missing_video')
    if (!input.thumbnailUri) issues.push('missing_thumbnail')
    return { ok: issues.length === 0, issues, requiresReview: issues.length > 0 }
  }

  async publish(input: PublishInput): Promise<PublicationResult> {
    const validation = await this.validate(input)
    if (!validation.ok) {
      return {
        ok: false,
        reality: 'FAILED',
        error: `validation_failed:${validation.issues.join(',')}`,
      }
    }
    const externalId = `mock_${input.platform}_${input.contentId.slice(0, 8)}_v1`
    return {
      ok: true,
      reality: 'MOCK',
      externalId,
      externalUrl: `https://mock.local/${input.platform.toLowerCase()}/${externalId}`,
      publishedAt: new Date().toISOString(),
      confirmation: 'mock_upload_processing_published',
    }
  }

  async schedule(input: PublishInput): Promise<PublicationResult> {
    const when = input.scheduledAt || new Date(Date.now() + 3600_000).toISOString()
    const published = await this.publish({ ...input, scheduledAt: when })
    if (!published.ok) return published
    return {
      ...published,
      scheduledAt: when,
      confirmation: 'mock_scheduled',
    }
  }
}
