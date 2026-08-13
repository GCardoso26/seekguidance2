import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { ffmpegService } from '../FFmpegService.js'
import type { CompositionInput, CompositionProvider, CompositionResult } from './CompositionProvider.js'
import { planKenBurnsScenes, zoompanFilter } from './KenBurnsPlanner.js'

function runFfmpeg(args: string[]): { ok: boolean; stderr: string } {
  const res = spawnSync('ffmpeg', ['-y', ...args], {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  })
  return { ok: res.status === 0, stderr: String(res.stderr || res.stdout || '') }
}

/**
 * Deterministic FFmpeg composer: images + Ken Burns + narration (+ optional music/subs) → MP4.
 * No generative video. VisualProvider is not used here.
 */
export class FfmpegCompositionProvider implements CompositionProvider {
  name = 'ffmpeg_kenburns'

  status() {
    return ffmpegService.available() ? ('READY' as const) : ('NOT_CONFIGURED' as const)
  }

  compose(input: CompositionInput): CompositionResult {
    if (this.status() !== 'READY') throw new Error('ffmpeg_not_available')
    if (!fs.existsSync(input.audioPath)) throw new Error('compose_missing_audio')
    if (!input.imagePaths.length) throw new Error('compose_missing_visuals')
    for (const p of input.imagePaths) {
      if (!fs.existsSync(p)) throw new Error(`compose_missing_visual:${p}`)
    }

    const { width, height, fps } = input.plan
    const scenes = planKenBurnsScenes({
      imagePaths: input.imagePaths,
      totalDurationSec: input.plan.targetDuration,
      storyboard: input.storyboard,
    })

    fs.mkdirSync(path.dirname(input.outPath), { recursive: true })
    const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cwm-kb-'))
    const clipPaths: string[] = []

    try {
      for (const scene of scenes) {
        const frames = Math.max(2, Math.round(scene.durationSec * fps))
        const clip = path.join(tmpRoot, `scene-${scene.scene}.mp4`)
        // Upscale + crop headroom, then Ken Burns down to target (spawnSync: commas OK)
        const bigW = width * 2
        const bigH = height * 2
        const vf = [
          `scale=${bigW}:${bigH}:force_original_aspect_ratio=increase`,
          `crop=${bigW}:${bigH}`,
          zoompanFilter({ motion: scene.motion, width, height, fps, frames }),
        ].join(',')

        const r = runFfmpeg([
          '-loop',
          '1',
          '-i',
          scene.imagePath,
          '-vf',
          vf,
          '-frames:v',
          String(frames),
          '-r',
          String(fps),
          '-c:v',
          'libx264',
          '-pix_fmt',
          'yuv420p',
          '-an',
          clip,
        ])
        if (!r.ok) throw new Error(`kenburns_scene_failed:${scene.scene}:${r.stderr.slice(0, 240)}`)
        clipPaths.push(clip)
      }

      const concatList = path.join(tmpRoot, 'concat.txt')
      fs.writeFileSync(
        concatList,
        clipPaths.map((p) => `file '${p.replace(/'/g, `'\\''`)}'`).join('\n'),
      )

      const silentVideo = path.join(tmpRoot, 'video-silent.mp4')
      const concat = runFfmpeg([
        '-f',
        'concat',
        '-safe',
        '0',
        '-i',
        concatList,
        '-c:v',
        'libx264',
        '-pix_fmt',
        'yuv420p',
        '-r',
        String(fps),
        silentVideo,
      ])
      if (!concat.ok) throw new Error(`kenburns_concat_failed:${concat.stderr.slice(0, 240)}`)

      const usedMusic = Boolean(input.musicPath && fs.existsSync(input.musicPath))
      const usedSubtitles = Boolean(
        input.plan.subtitle.burnIn && input.subtitlePath && fs.existsSync(input.subtitlePath),
      )

      const muxArgs: string[] = ['-i', silentVideo, '-i', input.audioPath]
      if (usedMusic) muxArgs.push('-i', input.musicPath!)

      // Audio: narration (+ optional quiet music bed)
      let filterComplex = ''
      if (usedMusic) {
        filterComplex = '[1:a]volume=1.0[narr];[2:a]volume=0.18[bed];[narr][bed]amix=inputs=2:duration=first:dropout_transition=0[aout]'
      }

      const vf: string[] = []
      if (usedSubtitles) {
        // Escape path for subtitles filter
        const escaped = input
          .subtitlePath!.replace(/\\/g, '/')
          .replace(/:/g, '\\:')
          .replace(/'/g, "\\'")
        vf.push(`subtitles='${escaped}'`)
      }

      muxArgs.push('-t', String(Math.max(1, input.plan.targetDuration)))
      if (filterComplex) {
        muxArgs.push('-filter_complex', filterComplex, '-map', '0:v', '-map', '[aout]')
      } else {
        muxArgs.push('-map', '0:v', '-map', '1:a')
      }
      if (vf.length) muxArgs.push('-vf', vf.join(','))
      muxArgs.push(
        '-c:v',
        'libx264',
        '-pix_fmt',
        'yuv420p',
        '-c:a',
        'aac',
        '-b:a',
        '128k',
        '-shortest',
        '-r',
        String(fps),
        input.outPath,
      )

      const mux = runFfmpeg(muxArgs)
      if (!mux.ok) throw new Error(`kenburns_mux_failed:${mux.stderr.slice(0, 300)}`)

      const probe = ffmpegService.probe(input.outPath)
      if (!(probe.duration > 0) || !probe.hasVideo || !probe.hasAudio) {
        throw new Error('compose_invalid_output')
      }

      return {
        path: input.outPath,
        duration: probe.duration,
        width: probe.width || width,
        height: probe.height || height,
        fps: probe.fps || fps,
        provider: this.name,
        kenBurns: scenes,
        usedSubtitles,
        usedMusic,
      }
    } finally {
      try {
        fs.rmSync(tmpRoot, { recursive: true, force: true })
      } catch {
        /* ignore cleanup */
      }
    }
  }
}

export const ffmpegCompositionProvider = new FfmpegCompositionProvider()
