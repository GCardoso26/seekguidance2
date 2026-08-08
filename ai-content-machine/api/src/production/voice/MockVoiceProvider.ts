import fs from 'node:fs'
import { ffmpegService } from '../FFmpegService.js'
import type { VoiceAsset, VoiceGenerateInput, VoiceProvider } from './VoiceProvider.js'

export class MockVoiceProvider implements VoiceProvider {
  name = 'mock_voice'

  status() {
    return 'READY' as const
  }

  async generate(input: VoiceGenerateInput): Promise<VoiceAsset> {
    if (!ffmpegService.available()) throw new Error('ffmpeg_not_available')
    ffmpegService.generateToneWav(input.outPath, input.durationSec, input.sampleRate)
    const st = fs.statSync(input.outPath)
    if (st.size <= 0) throw new Error('mock_voice_empty_file')
    const probe = ffmpegService.probe(input.outPath)
    if (!(probe.duration > 0)) throw new Error('mock_voice_no_duration')
    return {
      path: input.outPath,
      duration: probe.duration,
      sampleRate: input.sampleRate,
      sourceType: 'MOCK',
      provider: this.name,
      mimeType: 'audio/wav',
      costCents: 0,
    }
  }
}
