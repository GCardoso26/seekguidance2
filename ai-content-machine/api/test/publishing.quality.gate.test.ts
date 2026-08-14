import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { reviewVisualPublishability } from '../src/production/PublishingQualityGate.js'
import { buildContentPackageManifest } from '../src/production/ContentPackageBuilder.js'

function img(overrides: Record<string, unknown> = {}) {
  return {
    type: 'IMAGE',
    is_current: 1,
    file_size: 12000,
    checksum: 'a'.repeat(64),
    uri: '/tmp/scene.png',
    asset_key: 'visual:scene:1',
    provider: 'comfyui',
    source_type: 'GENERATED',
    license: 'GENERATED',
    ...overrides,
  }
}

const baseAssets = [
  {
    type: 'AUDIO',
    is_current: 1,
    file_size: 8000,
    checksum: 'b'.repeat(64),
    uri: '/tmp/voice.wav',
    license: 'MOCK',
  },
  {
    type: 'SUBTITLE',
    is_current: 1,
    file_size: 100,
    checksum: 'c'.repeat(64),
    uri: '/tmp/subs.srt',
    license: 'MOCK',
  },
  {
    type: 'THUMBNAIL',
    is_current: 1,
    file_size: 4000,
    checksum: 'd'.repeat(64),
    uri: '/tmp/thumb.jpg',
    license: 'GENERATED',
  },
  {
    type: 'FINAL_VIDEO',
    is_current: 1,
    file_size: 64000,
    checksum: 'e'.repeat(64),
    uri: '/tmp/final.mp4',
    license: 'MOCK',
  },
]

describe('PublishingQualityGate — perfectionist visual authorizer', () => {
  it('HOLDs mock_visual even when the MP4 is technically valid', () => {
    const review = reviewVisualPublishability([
      img({ provider: 'mock_visual', source_type: 'MOCK', license: 'MOCK' }),
    ])
    assert.equal(review.authorized, false)
    assert.equal(review.verdict, 'HOLD_FOR_REVIEW')
    assert.ok(review.findings.some((f) => f.startsWith('visuals_mock_not_publishable')))
    assert.equal(review.mockVisualCount, 1)
  })

  it('AUTHORIZEs ComfyUI GENERATED scenes', () => {
    const review = reviewVisualPublishability([img()])
    assert.equal(review.authorized, true)
    assert.equal(review.verdict, 'AUTHORIZE_PUBLISH')
    assert.equal(review.generatedVisualCount, 1)
  })

  it('AUTHORIZEs library HIT of a previously generated asset', () => {
    const review = reviewVisualPublishability([
      img({ provider: 'asset_library', source_type: 'GENERATED', license: 'GENERATED' }),
    ])
    assert.equal(review.authorized, true)
  })

  it('HOLDs library HIT of a mock catalog entry', () => {
    const review = reviewVisualPublishability([
      img({ provider: 'asset_library', source_type: 'MOCK', license: 'MOCK' }),
    ])
    assert.equal(review.authorized, false)
  })

  it('one mock scene poisons the whole board', () => {
    const review = reviewVisualPublishability([
      img({ asset_key: 'visual:scene:1' }),
      img({
        asset_key: 'visual:scene:2',
        provider: 'mock_visual',
        source_type: 'MOCK',
        license: 'MOCK',
      }),
    ])
    assert.equal(review.authorized, false)
    assert.equal(review.mockVisualCount, 1)
    assert.equal(review.generatedVisualCount, 1)
  })

  it('ContentPackageBuilder stamps READY_FOR_REVIEW when visuals are mock', () => {
    const { status, manifest } = buildContentPackageManifest({
      scriptId: 's1',
      productionId: 'p1',
      platform: 'YOUTUBE_SHORT',
      assets: [...baseAssets, img({ provider: 'mock_visual', source_type: 'MOCK', license: 'MOCK' })],
      qaStatus: 'PASS',
      licensesKnown: true,
      noUnresolvedFailure: true,
    })
    assert.equal(status, 'READY_FOR_REVIEW')
    assert.equal(manifest.qualityGate.visualsPublishable, false)
    assert.equal(manifest.qualityGate.visualsValid, true)
    assert.equal(manifest.visualReview?.verdict, 'HOLD_FOR_REVIEW')
  })

  it('ContentPackageBuilder stamps READY_FOR_PUBLISH only for GENERATED visuals', () => {
    const { status, manifest } = buildContentPackageManifest({
      scriptId: 's1',
      productionId: 'p1',
      platform: 'YOUTUBE_SHORT',
      assets: [...baseAssets, img()],
      qaStatus: 'PASS',
      licensesKnown: true,
      noUnresolvedFailure: true,
    })
    assert.equal(status, 'READY_FOR_PUBLISH')
    assert.equal(manifest.qualityGate.visualsPublishable, true)
    assert.equal(manifest.visualReview?.verdict, 'AUTHORIZE_PUBLISH')
  })
})
