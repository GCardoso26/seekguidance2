export type VisualProfile = {
  id: string
  label: string
  style: string
  lighting: string
  camera: string
  palette: string
  realism: string
  moodDefault: string
  maxScenes: number
  forbid: string[]
  negative: string
}

export type VisualCharacterBible = {
  id: string
  description: string
  appearance: string
  clothing: string
  age: string
  hair: string
}

export type VisualScenePlan = {
  scene: number
  role: string
  durationSec: number
  subject: string
  action: string
  environment: string
  camera: string
  lighting: string
  mood: string
  prompt: string
  negativePrompt: string
}

export type VisualPlan = {
  profileId: string
  style: string
  character: VisualCharacterBible
  scenes: VisualScenePlan[]
  negativeGlobal: string
  maxScenes: number
}

export type LibraryQualityStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export type VisualQaResult = {
  passed: boolean
  status: LibraryQualityStatus
  score: number
  findings: string[]
}
