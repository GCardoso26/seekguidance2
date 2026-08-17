import fs from 'node:fs'
import type { ProductionPlan, StoryboardScene } from './types.js'
import { ffmpegCompositionProvider } from './composition/FfmpegCompositionProvider.js'
import type { CompositionResult } from './composition/CompositionProvider.js'

/**
 * Thin facade — ProductionService keeps calling videoComposer.compose(...).
 * Ken Burns lives in CompositionProvider, not VisualProvider.
 */
export class VideoComposer {
  private composer = ffmpegCompositionProvider

  compose(input: {
    plan: ProductionPlan
    audioPath: string
    imagePaths: string[]
    outPath: string
    storyboard: StoryboardScene[]
    subtitlePath?: string | null
    musicPath?: string | null
    sfxPath?: string | null
  }): CompositionResult & {
    path: string
    duration: number
    width: number
    height: number
    fps: number
  } {
    if (!fs.existsSync(input.audioPath)) throw new Error('compose_missing_audio')
    if (!input.imagePaths.length || !fs.existsSync(input.imagePaths[0])) {
      throw new Error('compose_missing_visuals')
    }
    return this.composer.compose(input)
  }
}

export const videoComposer = new VideoComposer()
