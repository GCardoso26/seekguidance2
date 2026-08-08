export type PublishResult =
  | {
      ok: true
      reality: 'MOCK'
      platformPostId: string
      publishedAt: string
      confirmation: 'mock_platform_ack'
    }
  | {
      ok: false
      reality: 'FAILED'
      error: string
    }

/**
 * Mock publisher — NEVER claims REAL publication.
 */
export async function mockPublish(contentId: string, platform: string): Promise<PublishResult> {
  if (!contentId) {
    return { ok: false, reality: 'FAILED', error: 'missing contentId' }
  }
  return {
    ok: true,
    reality: 'MOCK',
    platformPostId: `mock_${platform}_${contentId.slice(0, 8)}`,
    publishedAt: new Date().toISOString(),
    confirmation: 'mock_platform_ack',
  }
}
