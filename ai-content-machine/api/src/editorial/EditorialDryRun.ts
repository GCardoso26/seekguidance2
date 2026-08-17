import { productionService } from '../production/ProductionService.js'
import { scriptFactoryService } from '../scriptFactory/ScriptFactoryService.js'
import { STAGE_ORDER, type ProductionStage } from '../production/types.js'
import type { DryRunStagePlan } from './types.js'

export type EditorialDryRunInput = {
  existingStages?: Partial<Record<ProductionStage, { ok?: boolean; provider?: string }>>
  includeEditorial?: boolean
}

function statusOf(value: unknown): 'READY' | 'NOT_CONFIGURED' | 'ERROR' {
  const v = String(value || 'NOT_CONFIGURED').toUpperCase()
  if (v === 'READY') return 'READY'
  if (v === 'ERROR') return 'ERROR'
  return 'NOT_CONFIGURED'
}

/**
 * Non-destructive plan. Never calls ProductionService.run / YouTube upload.
 * Resume: stages already ok are SKIP/DONE.
 */
export function planEditorialDryRun(input: EditorialDryRunInput = {}): {
  destructive: false
  resumeFrom: ProductionStage | 'EDITORIAL' | 'COMPLETE'
  stages: DryRunStagePlan[]
} {
  const script = scriptFactoryService.providersStatus()
  const production = productionService.providersStatus()
  const existing = input.existingStages || {}

  const exec: DryRunStagePlan[] = [
    {
      stage: 'SCRIPT',
      provider: `FallbackScriptProvider:gemini=${script.gemini}/groq=${script.groq}/ollama=${script.ollama}/api=${script.api}/mock=${script.mock}`,
      status: statusOf(script.status),
      expectedOutput: 'scripts row + structured JSON (hook/setup/problem/insight/value/proof/cta)',
      dependencies: ['content_idea'],
      estimatedWork: '1 LLM pack or mock pack',
    },
    {
      stage: 'PLANNING',
      provider: 'ProductionPlanner+VisualDirector',
      status: 'READY',
      expectedOutput: 'storyboard + VisualPlan (canonical CWM schema)',
      dependencies: ['SCRIPT'],
      estimatedWork: 'in-process',
    },
    {
      stage: 'VOICE',
      provider: `FallbackVoiceProvider:kokoro=${production.voice.kokoro}/api=${production.voice.real}/mock=${production.voice.mock}`,
      status: statusOf(production.voice.status),
      expectedOutput: 'AUDIO wav + provider trail',
      dependencies: ['PLANNING'],
      estimatedWork: 'TTS or ffmpeg tone',
    },
    {
      stage: 'VISUALS',
      provider: `createVisualResolver:library→pexels=${production.visual.pexels}|pixabay=${production.visual.pixabay}|comfy=${production.visual.comfy}|manual=${production.visual.manual}|mock=${production.visual.mock}`,
      status: statusOf(production.visual.status),
      expectedOutput: 'IMAGE frames + library usage_count; mock_visual never publishable',
      dependencies: ['PLANNING'],
      estimatedWork: 'library lookup then stock, optional Comfy, or manual fallback',
    },
    {
      stage: 'SUBTITLES',
      provider: 'SubtitleService',
      status: 'READY',
      expectedOutput: 'SRT/VTT',
      dependencies: ['PLANNING'],
      estimatedWork: 'in-process',
    },
    {
      stage: 'COMPOSING',
      provider: `CompositionProvider:ffmpeg_kenburns=${production.composition.ffmpeg_kenburns}`,
      status: statusOf(production.ffmpeg),
      expectedOutput: 'FINAL_VIDEO mp4 (Ken Burns). ComfyUI is not imported here.',
      dependencies: ['VOICE', 'VISUALS'],
      estimatedWork: 'ffmpeg',
    },
    {
      stage: 'THUMBNAIL',
      provider: 'MockThumbnailProvider (frame extract when ffmpeg READY)',
      status: statusOf(production.thumbnail.mock),
      expectedOutput: 'THUMBNAIL jpg',
      dependencies: ['COMPOSING'],
      estimatedWork: 'ffmpeg frame or mock',
    },
    {
      stage: 'QA',
      provider: 'MediaQAService+PublishingQualityGate',
      status: 'READY',
      expectedOutput: 'PASS|FAIL|REQUIRES_REVIEW; mock_visual → READY_FOR_REVIEW',
      dependencies: ['COMPOSING', 'THUMBNAIL'],
      estimatedWork: 'ffprobe + gates',
    },
    {
      stage: 'STORAGE',
      provider: `AssetStorage:${production.storage.local}`,
      status: 'READY',
      expectedOutput: 'content_packages row + checksums',
      dependencies: ['QA'],
      estimatedWork: 'filesystem',
    },
  ]

  if (input.includeEditorial !== false) {
    exec.unshift(
      {
        stage: 'RESEARCH',
        provider: 'ResearchService (mock unless configured)',
        status: 'READY',
        expectedOutput: 'topics + source_trace',
        dependencies: ['channel.json'],
        estimatedWork: 'provider search',
      },
      {
        stage: 'IDEA',
        provider: 'IdeaScorer',
        status: 'READY',
        expectedOutput: 'scored ideas 0–100',
        dependencies: ['RESEARCH'],
        estimatedWork: 'in-process',
      },
    )
  }

  const stages = exec.map((s) => {
    const key = s.stage as ProductionStage
    if (existing[key]?.ok) {
      return {
        ...s,
        status: 'DONE' as const,
        skipReason: 'stage_already_ok',
        provider: existing[key]?.provider || s.provider,
      }
    }
    return s
  })

  const resumeFrom =
    (STAGE_ORDER.find((s) => !existing[s]?.ok) as ProductionStage | undefined) ||
    (stages.every((s) => s.status === 'DONE') ? 'COMPLETE' : 'EDITORIAL')

  return { destructive: false, resumeFrom, stages }
}
