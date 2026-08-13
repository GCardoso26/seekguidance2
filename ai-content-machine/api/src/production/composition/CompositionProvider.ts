import type { ProductionPlan, StoryboardScene } from '../types.js'
import type { KenBurnsScenePlan } from './KenBurnsPlanner.js'

export type CompositionInput = {
  plan: ProductionPlan
  audioPath: string
  imagePaths: string[]
  outPath: string
  storyboard: StoryboardScene[]
  /** Optional SRT for burn-in when plan.subtitle.burnIn */
  subtitlePath?: string | null
  /** Optional bed music — mixed under narration when present */
  musicPath?: string | null
}

export type CompositionResult = {
  path: string
  duration: number
  width: number
  height: number
  fps: number
  provider: string
  kenBurns: KenBurnsScenePlan[]
  usedSubtitles: boolean
  usedMusic: boolean
}

export interface CompositionProvider {
  name: string
  status(): 'READY' | 'NOT_CONFIGURED'
  compose(input: CompositionInput): CompositionResult
}
