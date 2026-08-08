import { publishingService } from './PublishingService.js'
import { analyticsService } from '../analytics/AnalyticsService.js'
import { winnerDetectionService } from '../winner/WinnerDetectionService.js'
import { strategyService } from '../strategy/StrategyService.js'
import type { MockScenario } from '../analytics/MockAnalyticsProvider.js'

/**
 * End-to-end feedback orchestration (mock-safe):
 * READY_FOR_PUBLISH → PUBLISH → METRICS → WINNER → STRATEGY → RESEARCH
 */
export class FeedbackLoopService {
  async run(input: {
    workspaceId: string
    contentId: string
    platform?: string
    scenario?: MockScenario
    executionId?: string
    minimumEvidence?: number
    feedResearch?: boolean
  }) {
    const published = await publishingService.run({
      workspaceId: input.workspaceId,
      contentId: input.contentId,
      platform: input.platform,
      executionId: input.executionId,
    })
    if (published.status !== 'PUBLISHED' && !published.skipped) {
      return {
        status: 'FAILED' as const,
        stage: 'publishing',
        published,
      }
    }
    const publicationRunId = published.publicationRunId!
    // Ensure deterministic winner scenario when requested
    if (input.scenario === 'WINNER' && published.externalId) {
      // external id already set; analytics uses scenario override
    }

    const analytics = await analyticsService.sync({
      workspaceId: input.workspaceId,
      publicationId: publicationRunId,
      scenario: input.scenario || 'WINNER',
      executionId: input.executionId,
    })

    const winners = await winnerDetectionService.detect({
      workspaceId: input.workspaceId,
      publicationId: publicationRunId,
      ageHoursOverride: 24,
      criteria: { minimumAgeHours: 0 },
      executionId: input.executionId,
    })

    const strategy = await strategyService.analyze({
      workspaceId: input.workspaceId,
      minimumEvidence: input.minimumEvidence ?? 1, // single-winner hypothesis in loop; strong needs 3 in dedicated tests
      feedResearch: input.feedResearch ?? true,
      executionId: input.executionId,
    })

    return {
      status: 'COMPLETED' as const,
      reality: 'MOCK' as const,
      publicationRunId,
      published,
      analytics,
      winners,
      strategy,
    }
  }
}

export const feedbackLoopService = new FeedbackLoopService()
