import fs from 'node:fs'
import { ffmpegService } from './FFmpegService.js'
import type { ProductionPlan, StoryboardScene } from './types.js'

export class VideoComposer {
  compose(input: {
    plan: ProductionPlan
    audioPath: string
    imagePaths: string[]
    outPath: string
    storyboard: StoryboardScene[]
  }): { path: string; duration: number; width: number; height: number; fps: number } {
    if (!ffmpegService.available()) throw new Error('ffmpeg_not_available')
    if (!fs.existsSync(input.audioPath)) throw new Error('compose_missing_audio')
    if (!input.imagePaths.length || !fs.existsSync(input.imagePaths[0])) {
      throw new Error('compose_missing_visuals')
    }

    ffmpegService.composeVerticalVideo({
      audioPath: input.audioPath,
      imagePaths: input.imagePaths,
      outPath: input.outPath,
      width: input.plan.width,
      height: input.plan.height,
      fps: input.plan.fps,
      durationSec: input.plan.targetDuration,
    })

    const probe = ffmpegService.probe(input.outPath)
    if (!(probe.duration > 0) || !probe.hasVideo || !probe.hasAudio) {
      throw new Error('compose_invalid_output')
    }

    return {
      path: input.outPath,
      duration: probe.duration,
      width: probe.width,
      height: probe.height,
      fps: probe.fps,
    }
  }
}

export const videoComposer = new VideoComposer()
