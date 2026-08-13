import fs from 'node:fs'
import path from 'node:path'
import { ffmpegService } from '../FFmpegService.js'
import type { VoiceAsset, VoiceGenerateInput, VoiceProvider } from './VoiceProvider.js'

/**
 * Local Kokoro TTS via OpenAI-compatible POST /v1/audio/speech
 * (Kokoro-FastAPI, docker-kokoro, etc.).
 *
 * Env:
 * - KOKORO_BASE_URL — e.g. http://127.0.0.1:8880 (with or without /v1)
 * - KOKORO_VOICE — default af_bella
 * - KOKORO_MODEL — default kokoro
 * - KOKORO_API_KEY — optional Bearer
 */
export class KokoroVoiceProvider implements VoiceProvider {
  name = 'kokoro'

  status() {
    return this.baseUrl() ? ('READY' as const) : ('NOT_CONFIGURED' as const)
  }

  private baseUrl(): string {
    return (process.env.KOKORO_BASE_URL || '').replace(/\/$/, '')
  }

  private speechUrl(): string {
    const base = this.baseUrl()
    if (base.endsWith('/v1')) return `${base}/audio/speech`
    return `${base}/v1/audio/speech`
  }

  async generate(input: VoiceGenerateInput): Promise<VoiceAsset> {
    if (this.status() === 'NOT_CONFIGURED') {
      throw Object.assign(new Error('provider_not_configured:kokoro'), { code: 'NOT_CONFIGURED' })
    }
    if (!input.text?.trim()) throw new Error('kokoro_empty_text')

    const voice = process.env.KOKORO_VOICE || 'af_bella'
    const model = process.env.KOKORO_MODEL || 'kokoro'
    const headers: Record<string, string> = { 'content-type': 'application/json' }
    const apiKey = process.env.KOKORO_API_KEY || process.env.VOICE_API_KEY
    if (apiKey) headers.authorization = `Bearer ${apiKey}`

    const res = await fetch(this.speechUrl(), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        input: input.text.slice(0, 4096),
        voice,
        response_format: 'wav',
        speed: 1.0,
      }),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(`kokoro_tts_failed:${res.status}:${body.slice(0, 200)}`)
    }

    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length < 44) throw new Error('kokoro_tts_empty_audio')

    fs.mkdirSync(path.dirname(input.outPath), { recursive: true })
    const contentType = (res.headers.get('content-type') || '').toLowerCase()
    const looksWav = buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46

    if (looksWav || contentType.includes('wav')) {
      fs.writeFileSync(input.outPath, buf)
    } else {
      const tmp = `${input.outPath}.tmp.bin`
      fs.writeFileSync(tmp, buf)
      try {
        if (!ffmpegService.available()) {
          throw new Error('kokoro_non_wav_without_ffmpeg')
        }
        ffmpegService.transcodeToWav(tmp, input.outPath, input.sampleRate)
      } finally {
        try {
          fs.unlinkSync(tmp)
        } catch {
          /* ignore */
        }
      }
    }

    const st = fs.statSync(input.outPath)
    if (st.size <= 0) throw new Error('kokoro_tts_empty_file')
    const probe = ffmpegService.available()
      ? ffmpegService.probe(input.outPath)
      : { duration: input.durationSec, hasAudio: true, hasVideo: false }
    if (!(probe.duration > 0)) throw new Error('kokoro_tts_no_duration')

    return {
      path: input.outPath,
      duration: probe.duration,
      sampleRate: input.sampleRate,
      sourceType: 'GENERATED',
      provider: this.name,
      mimeType: 'audio/wav',
      costCents: 0,
    }
  }
}
