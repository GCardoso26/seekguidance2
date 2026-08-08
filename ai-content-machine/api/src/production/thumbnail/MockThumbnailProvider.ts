import fs from 'node:fs'
import { ffmpegService } from '../FFmpegService.js'
import type { ThumbnailAsset, ThumbnailInput, ThumbnailProvider } from './ThumbnailProvider.js'

export class MockThumbnailProvider implements ThumbnailProvider {
  name = 'mock_thumbnail'

  status() {
    return 'READY' as const
  }

  async generate(input: ThumbnailInput): Promise<ThumbnailAsset> {
    if (!ffmpegService.available()) throw new Error('ffmpeg_not_available')
    ffmpegService.generateColorImage(input.outPath, input.width, input.height, '0xE94560')
    const st = fs.statSync(input.outPath)
    if (st.size <= 0) throw new Error('mock_thumbnail_empty')
    const text = input.hook.slice(0, 48) || 'NEXUS IA'
    return {
      path: input.outPath,
      concept: `${input.brand} · ${input.visualStyle} · ${input.topic.slice(0, 40)}`,
      text,
      sourceType: 'MOCK',
      provider: this.name,
      mimeType: 'image/png',
      costCents: 0,
    }
  }
}
