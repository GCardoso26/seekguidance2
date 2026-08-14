import type { VisualCharacterBible, VisualPlan, VisualProfile, VisualScenePlan } from './visualTypes.js'
import { getVisualProfile } from './VisualProfileRegistry.js'
import { buildScenePrompt } from './VisualPromptBuilder.js'

const SECTION_ENV: Record<string, string> = {
  hook: 'tight vertical frame that stops the scroll, real-world subject',
  setup: 'modern interior establishing the situation',
  problem: 'home office or desk where the problem becomes visible',
  insight: 'clean workspace showing the practical insight',
  value: 'practical demonstration environment, uncluttered',
  proof: 'credible real-world proof moment, no fake UI overlays',
  cta: 'calm end-frame environment ready for a soft call to action',
}

const SECTION_CAMERA: Record<string, string> = {
  hook: 'medium close-up, eye-level, strong subject separation',
  setup: 'medium shot, slight establishing width',
  problem: 'medium close-up, eye-level',
  insight: 'over-the-shoulder or medium shot of the working subject',
  value: 'medium shot with shallow depth of field',
  proof: 'close-up detail or medium shot of the outcome',
  cta: 'stable medium shot, calm composition',
}

const SECTION_ACTION: Record<string, string> = {
  hook: 'faces a revealing moment that matches the hook',
  setup: 'enters the situation described by the narration',
  problem: 'reacts to a setback with restrained concern',
  insight: 'discovers a clearer way forward',
  value: 'applies the practical tip with focus',
  proof: 'sees a concrete improvement',
  cta: 'pauses, ready for the next step suggested by the CTA',
}

function defaultCharacter(): VisualCharacterBible {
  return {
    id: 'protagonist_v1',
    description: 'Same adult professional recurring across every scene of this Short',
    appearance: 'southern-european / brazilian adult, naturalistic features, no beauty filters',
    clothing: 'navy or charcoal smart-casual shirt, no logos',
    age: '35 years old',
    hair: 'short dark hair, neat',
  }
}

function subjectFor(role: string, character: VisualCharacterBible, narration: string): string {
  const clip = narration.replace(/\s+/g, ' ').trim().slice(0, 90)
  return `A ${character.age} ${character.appearance} with ${character.hair}, wearing ${character.clothing}, in a scene about: ${clip || role}`
}

/**
 * Visual Director — deterministic plan from script + VisualProfile.
 * Chooses WHAT to show; the profile chooses HOW; Comfy only renders.
 * No free-form aesthetic invention from the LLM.
 */
export function buildVisualPlan(input: {
  scriptBody: Record<string, string>
  platform?: string
  nicheName?: string | null
  preferredProfileId?: string | null
  targetDurationSec?: number
  maxScenes?: number
}): VisualPlan {
  const scriptText = Object.values(input.scriptBody || {}).join(' ')
  const profile = getVisualProfile({
    nicheName: input.nicheName,
    scriptText,
    preferredId: input.preferredProfileId,
  })
  const character = defaultCharacter()
  const sections = ['hook', 'setup', 'problem', 'insight', 'value', 'proof', 'cta'] as const
  const texts = sections
    .map((k) => ({ role: k, text: String(input.scriptBody[k] || '').trim() }))
    .filter((x) => x.text)

  const maxScenes = Math.max(
    3,
    Math.min(7, input.maxScenes || profile.maxScenes || 5),
  )
  const picked = texts.slice(0, Math.min(maxScenes, Math.max(3, texts.length)))
  const duration = Math.max(8, Number(input.targetDurationSec) || 30)
  const each = duration / picked.length

  const scenes: VisualScenePlan[] = picked.map((seg, i) => {
    const scene = buildScenePlan({
      scene: i + 1,
      role: seg.role,
      durationSec: Number(each.toFixed(2)),
      narration: seg.text,
      character,
      profile,
    })
    return scene
  })

  return {
    profileId: profile.id,
    style: profile.style,
    character,
    scenes,
    negativeGlobal: profile.negative,
    maxScenes,
  }
}

export function buildScenePlan(input: {
  scene: number
  role: string
  durationSec: number
  narration: string
  character: VisualCharacterBible
  profile: VisualProfile
}): VisualScenePlan {
  const subject = subjectFor(input.role, input.character, input.narration)
  const action = SECTION_ACTION[input.role] || 'acts naturally according to the narration'
  const environment = SECTION_ENV[input.role] || 'modern realistic interior'
  const camera = `${input.profile.camera}; ${SECTION_CAMERA[input.role] || 'medium shot'}`
  const lighting = input.profile.lighting
  const mood = input.profile.moodDefault
  const prompt = buildScenePrompt({
    subject,
    action,
    environment,
    camera,
    lighting,
    style: input.profile.style,
    mood,
    quality: input.profile.realism,
    characterLock: `${input.character.description}. ${input.character.appearance}. ${input.character.clothing}. Age ${input.character.age}. Hair: ${input.character.hair}.`,
    palette: input.profile.palette,
  })
  return {
    scene: input.scene,
    role: input.role,
    durationSec: input.durationSec,
    subject,
    action,
    environment,
    camera,
    lighting,
    mood,
    prompt,
    negativePrompt: input.profile.negative,
  }
}

/** Re-time an existing plan after voice duration changes without rewriting aesthetics. */
export function retimedVisualPlan(plan: VisualPlan, targetDurationSec: number): VisualPlan {
  if (!plan.scenes.length) return plan
  const each = Math.max(1, targetDurationSec / plan.scenes.length)
  return {
    ...plan,
    scenes: plan.scenes.map((s) => ({
      ...s,
      durationSec: Number(each.toFixed(2)),
    })),
  }
}
