export type AiTask =
  | 'classification'
  | 'idea_generation'
  | 'script_generation'
  | 'strategy'
  | 'recycling'

export type AiRoute = {
  provider: 'mock' | 'openai_compatible'
  model: string
  estimatedCostCents: number
  quality: 'low' | 'medium' | 'high'
}

export function routeAi(task: AiTask, opts?: { budgetCents?: number; preferSpeed?: boolean }): AiRoute {
  const budget = opts?.budgetCents ?? 100

  if (task === 'classification' || opts?.preferSpeed) {
    return {
      provider: budget > 0 ? 'openai_compatible' : 'mock',
      model: 'gpt-4o-mini',
      estimatedCostCents: 1,
      quality: 'low',
    }
  }

  if (task === 'strategy') {
    return {
      provider: 'openai_compatible',
      model: 'gpt-4o',
      estimatedCostCents: 8,
      quality: 'high',
    }
  }

  if (task === 'script_generation' || task === 'recycling') {
    return {
      provider: 'openai_compatible',
      model: 'gpt-4o-mini',
      estimatedCostCents: 3,
      quality: 'medium',
    }
  }

  return {
    provider: 'openai_compatible',
    model: 'gpt-4o-mini',
    estimatedCostCents: 2,
    quality: 'medium',
  }
}
