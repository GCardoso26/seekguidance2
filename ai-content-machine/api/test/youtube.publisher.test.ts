import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { resetDbForTests, getDb, uid, nowIso } from '../src/db/client.js'
import { bootstrapWorkspace } from '../src/services/pipelines/dailyContentEngine.js'
import { encryptSecret } from '../src/credentials/crypto.js'
import { youtubePublisher } from '../src/publishing/youtube/YouTubePublisher.js'

process.env.AUTOMATION_MODE = 'mock'

function connectYoutube(workspaceId: string) {
  const accessEnc = encryptSecret('fake-access-token')
  getDb()
    .prepare(
      `INSERT INTO platform_connections
       (id, workspace_id, platform, status, scopes, access_token_enc, refresh_token_enc,
        token_expires_at, last_verified_at, metadata, reality, created_at, updated_at)
       VALUES (?, ?, 'YOUTUBE', 'CONNECTED', '[]', ?, NULL, NULL, ?, '{}', 'REAL', ?, ?)`,
    )
    .run(uid(), workspaceId, accessEnc, nowIso(), nowIso(), nowIso())
}

describe('YouTubePublisher — thumbnail upload after video upload', () => {
  const tmp = path.join(os.tmpdir(), `cwm-ytpub-${Date.now()}.sqlite`)
  let workspaceId = ''
  let videoPath = ''
  let thumbPath = ''
  let originalFetch: typeof fetch

  before(async () => {
    process.env.CWM_CREDENTIALS_ENCRYPTION_KEY = 'yt-publisher-test-encryption-key-32c'
    resetDbForTests(tmp)
    const boot = await bootstrapWorkspace({ name: 'YT Publisher', email: 'ytpub@cwm.test' })
    workspaceId = boot.workspaceId
    connectYoutube(workspaceId)

    const dir = path.join(os.tmpdir(), `cwm-ytpub-assets-${Date.now()}`)
    fs.mkdirSync(dir, { recursive: true })
    videoPath = path.join(dir, 'final.mp4')
    thumbPath = path.join(dir, 'thumb.png')
    fs.writeFileSync(videoPath, Buffer.from('fake-mp4-bytes'))
    fs.writeFileSync(thumbPath, Buffer.from('fake-png-bytes'))
    originalFetch = globalThis.fetch
  })

  after(() => {
    globalThis.fetch = originalFetch
  })

  /** Fakes the 3 real HTTP calls a full publish makes: init session, PUT bytes, thumbnails.set. */
  function mockFetch(thumbnailStatus: number) {
    globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
      const u = String(url)
      const method = init?.method || 'GET'
      if (u.includes('/upload/youtube/v3/videos') && method === 'POST') {
        return new Response(null, {
          status: 200,
          headers: { location: 'https://fake-upload.example.com/session-1' },
        })
      }
      if (u === 'https://fake-upload.example.com/session-1' && method === 'PUT') {
        return new Response(JSON.stringify({ id: 'video-123' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      }
      if (u.includes('/upload/youtube/v3/thumbnails/set') && method === 'POST') {
        if (thumbnailStatus >= 400) {
          return new Response('thumbnail upload failed', { status: thumbnailStatus })
        }
        return new Response(JSON.stringify({}), { status: 200 })
      }
      throw new Error(`unexpected fetch in test: ${method} ${u}`)
    }) as typeof fetch
  }

  it('uploads the thumbnail via thumbnails.set after a successful video upload', async () => {
    mockFetch(200)
    const result = await youtubePublisher.publish({
      workspaceId,
      contentId: uid(),
      publicationId: uid(),
      platform: 'YOUTUBE_SHORT',
      metadata: {
        title: 'Título de teste',
        description: 'Descrição de teste',
        caption: 'cap',
        hashtags: [],
        tags: [],
        category: 'education',
        language: 'pt-BR',
      },
      videoUri: videoPath,
      thumbnailUri: thumbPath,
    })
    assert.equal(result.ok, true)
    assert.equal(result.externalId, 'video-123')
    assert.ok(!result.warnings || result.warnings.length === 0)
  })

  it('does not fail the whole publish when thumbnail upload fails — attaches a warning instead', async () => {
    mockFetch(500)
    const result = await youtubePublisher.publish({
      workspaceId,
      contentId: uid(),
      publicationId: uid(),
      platform: 'YOUTUBE_SHORT',
      metadata: {
        title: 'Título de teste 2',
        description: 'Descrição de teste 2',
        caption: 'cap',
        hashtags: [],
        tags: [],
        category: 'education',
        language: 'pt-BR',
      },
      videoUri: videoPath,
      thumbnailUri: thumbPath,
    })
    assert.equal(result.ok, true, 'video SUCCESS must still stand even if thumbnail upload fails')
    assert.equal(result.externalId, 'video-123')
    assert.ok(result.warnings && result.warnings.length > 0)
    assert.ok(result.warnings![0].includes('youtube_thumbnail_failed'))
  })
})
