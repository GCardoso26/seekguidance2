import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

export type ProbeResult = {
  duration: number
  width: number
  height: number
  fps: number
  hasAudio: boolean
  hasVideo: boolean
  videoCodec: string
  audioCodec: string
  format: string
}

function runFfmpeg(args: string[]): { ok: boolean; stderr: string } {
  const res = spawnSync('ffmpeg', ['-y', ...args], {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  })
  return { ok: res.status === 0, stderr: String(res.stderr || res.stdout || '') }
}

function runFfprobe(args: string[]): { ok: boolean; stdout: string; stderr: string } {
  const res = spawnSync('ffprobe', args, { encoding: 'utf8', maxBuffer: 5 * 1024 * 1024 })
  return {
    ok: res.status === 0,
    stdout: String(res.stdout || ''),
    stderr: String(res.stderr || ''),
  }
}

export class FFmpegService {
  available(): boolean {
    const r = spawnSync('ffmpeg', ['-version'], { encoding: 'utf8' })
    return r.status === 0
  }

  generateToneWav(outPath: string, durationSec: number, sampleRate = 44100): void {
    fs.mkdirSync(path.dirname(outPath), { recursive: true })
    const r = runFfmpeg([
      '-f',
      'lavfi',
      '-i',
      `sine=frequency=440:duration=${Math.max(0.5, durationSec)}`,
      '-ar',
      String(sampleRate),
      outPath,
    ])
    if (!r.ok) throw new Error(`ffmpeg_voice_failed:${r.stderr.slice(0, 200)}`)
  }

  generateColorImage(outPath: string, width: number, height: number, color = '0x0B6E6E'): void {
    fs.mkdirSync(path.dirname(outPath), { recursive: true })
    const r = runFfmpeg([
      '-f',
      'lavfi',
      '-i',
      `color=c=${color}:s=${width}x${height}:d=1`,
      '-frames:v',
      '1',
      outPath,
    ])
    if (!r.ok) throw new Error(`ffmpeg_image_failed:${r.stderr.slice(0, 200)}`)
  }

  composeVerticalVideo(input: {
    audioPath: string
    imagePaths: string[]
    outPath: string
    width: number
    height: number
    fps: number
    durationSec: number
  }): void {
    fs.mkdirSync(path.dirname(input.outPath), { recursive: true })
    const image = input.imagePaths[0]
    if (!image) throw new Error('ffmpeg_compose_no_image')
    const r = runFfmpeg([
      '-loop',
      '1',
      '-i',
      image,
      '-i',
      input.audioPath,
      '-c:v',
      'libx264',
      '-tune',
      'stillimage',
      '-c:a',
      'aac',
      '-b:a',
      '128k',
      '-pix_fmt',
      'yuv420p',
      '-shortest',
      '-r',
      String(input.fps),
      '-s',
      `${input.width}x${input.height}`,
      '-t',
      String(Math.max(1, input.durationSec)),
      input.outPath,
    ])
    if (!r.ok) throw new Error(`ffmpeg_compose_failed:${r.stderr.slice(0, 300)}`)
  }

  extractFrame(videoPath: string, outPath: string, atSec = 0.5): void {
    fs.mkdirSync(path.dirname(outPath), { recursive: true })
    const r = runFfmpeg(['-ss', String(atSec), '-i', videoPath, '-frames:v', '1', outPath])
    if (!r.ok) throw new Error(`ffmpeg_thumbnail_failed:${r.stderr.slice(0, 200)}`)
  }

  probe(filePath: string): ProbeResult {
    const r = runFfprobe([
      '-v',
      'error',
      '-show_entries',
      'format=duration,format_name:stream=codec_type,codec_name,width,height,r_frame_rate',
      '-of',
      'json',
      filePath,
    ])
    if (!r.ok) throw new Error(`ffprobe_failed:${r.stderr.slice(0, 200)}`)
    const json = JSON.parse(r.stdout) as {
      format?: { duration?: string; format_name?: string }
      streams?: Array<{
        codec_type?: string
        codec_name?: string
        width?: number
        height?: number
        r_frame_rate?: string
      }>
    }
    const streams = json.streams || []
    const video = streams.find((s) => s.codec_type === 'video')
    const audio = streams.find((s) => s.codec_type === 'audio')
    let fps = 30
    if (video?.r_frame_rate && video.r_frame_rate.includes('/')) {
      const [a, b] = video.r_frame_rate.split('/').map(Number)
      if (b) fps = a / b
    }
    return {
      duration: Number(json.format?.duration || 0),
      width: video?.width || 0,
      height: video?.height || 0,
      fps,
      hasAudio: Boolean(audio),
      hasVideo: Boolean(video),
      videoCodec: video?.codec_name || '',
      audioCodec: audio?.codec_name || '',
      format: json.format?.format_name || '',
    }
  }
}

export const ffmpegService = new FFmpegService()
