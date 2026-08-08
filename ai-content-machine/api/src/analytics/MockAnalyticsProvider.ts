import type { CanonicalMetrics } from '../publishing/types.js'

export type MockScenario = 'WINNER' | 'NORMAL' | 'LOSER' | 'INSUFFICIENT_DATA'

/**
 * Deterministic mock metrics — NO pure randomness.
 * Scenario selects a fixed profile for reproducible Winner Engine tests.
 */
export class MockAnalyticsProvider {
  name = 'mock_analytics'
  status() {
    return 'READY' as const
  }

  fetch(input: {
    externalId: string
    platform: string
    scenario?: MockScenario
  }): { metrics: CanonicalMetrics; raw: Record<string, unknown>; scenario: MockScenario } {
    const scenario = input.scenario || this.inferScenario(input.externalId)
    const metrics = this.profile(scenario)
    return {
      scenario,
      metrics,
      raw: {
        provider: this.name,
        platform: input.platform,
        externalId: input.externalId,
        scenario,
        ...metrics,
      },
    }
  }

  /** Map known suffixes / seeds to scenarios for tests */
  inferScenario(externalId: string): MockScenario {
    const id = externalId.toLowerCase()
    if (id.includes('winner') || id.endsWith('_w')) return 'WINNER'
    if (id.includes('loser') || id.endsWith('_l')) return 'LOSER'
    if (id.includes('insufficient') || id.endsWith('_i')) return 'INSUFFICIENT_DATA'
    if (id.includes('normal') || id.endsWith('_n')) return 'NORMAL'
    // Deterministic hash bucket (stable, not random)
    let hash = 0
    for (let i = 0; i < externalId.length; i++) hash = (hash + externalId.charCodeAt(i) * (i + 1)) % 100
    if (hash < 25) return 'WINNER'
    if (hash < 50) return 'NORMAL'
    if (hash < 75) return 'LOSER'
    return 'INSUFFICIENT_DATA'
  }

  profile(scenario: MockScenario): CanonicalMetrics {
    switch (scenario) {
      case 'WINNER':
        return {
          views: 12000,
          likes: 1200,
          comments: 240,
          shares: 360,
          saves: 480,
          watchTime: 12000 * 24,
          averageViewDuration: 24,
          completionRate: 0.68,
          followersGained: 180,
          clicks: 480,
          conversions: 48,
        }
      case 'NORMAL':
        return {
          views: 2500,
          likes: 150,
          comments: 35,
          shares: 25,
          saves: 50,
          watchTime: 2500 * 16,
          averageViewDuration: 16,
          completionRate: 0.42,
          followersGained: 20,
          clicks: 55,
          conversions: 4,
        }
      case 'LOSER':
        return {
          views: 800,
          likes: 12,
          comments: 2,
          shares: 1,
          saves: 3,
          watchTime: 800 * 7,
          averageViewDuration: 7,
          completionRate: 0.2,
          followersGained: 0,
          clicks: 5,
          conversions: 0,
        }
      case 'INSUFFICIENT_DATA':
      default:
        return {
          views: 40,
          likes: 1,
          comments: 0,
          shares: 0,
          saves: 0,
          watchTime: 40 * 5,
          averageViewDuration: 5,
          completionRate: 0.1,
          followersGained: 0,
          clicks: 0,
          conversions: 0,
        }
    }
  }
}

export const mockAnalyticsProvider = new MockAnalyticsProvider()
