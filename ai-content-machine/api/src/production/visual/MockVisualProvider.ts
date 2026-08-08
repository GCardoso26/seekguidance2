import fs from 'node:fs'
import { ffmpegService } from '../FFmpegService.js'
import type { VisualAsset, VisualGenerateInput, VisualProvider } from './VisualProvider.js'

const COLORS = ['0x0B6E6E', '0x1a1a2e', '0x16213e', '0x0f3460', '0x533483']

export class MockVisualProvider implements VisualProvider {
  name = 'mock_visual'

  status() {
    return 'READY' as const
  }

  async generate(input: VisualGenerateInput): Promise<VisualAsset> {
    if (!ffmpegService.available()) throw new Error('ffmpeg_not_available')
    const color = COLORS[(input.scene - 1) % COLORS.length]
    ffmpegService.generateColorImage(input.outPath, input.width, input.height, color)
    const st = fs.statSync(input.outPath)
    if (st.size <= 0) throw new Error('mock_visual_empty_file')
    return {
      path: input.outPath,
      width: input.width,
      height: input.height,
      sourceType: 'MOCK',
      provider: this.name,
      mimeType: 'image/png',
      license: 'MOCK',
      prompt: input.prompt,
      costCents: 0,
      metadata: {
        sourceUrl: `mock://visual/scene/${input.scene}`,
        generatedAt: new Date().toISOString(),
        scene: input.scene,
      },
    }
  }
}
