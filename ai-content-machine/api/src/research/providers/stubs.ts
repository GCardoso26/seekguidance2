import type { ResearchInput, ResearchProvider, ResearchResult, ProviderStatus } from '../types.js'

abstract class NotConfiguredProvider implements ResearchProvider {
  abstract name: string
  status: ProviderStatus = 'NOT_CONFIGURED'

  async search(_input: ResearchInput): Promise<ResearchResult[]> {
    // Never claim SUCCESS — surface NOT_CONFIGURED explicitly to the service
    const err = new Error(`provider_not_configured:${this.name}`)
    ;(err as Error & { code: string }).code = 'NOT_CONFIGURED'
    throw err
  }
}

export class SearchProviderStub extends NotConfiguredProvider {
  name = 'search'
}

export class YouTubeResearchProviderStub extends NotConfiguredProvider {
  name = 'youtube'
}

export class RedditResearchProviderStub extends NotConfiguredProvider {
  name = 'reddit'
}

export class TrendResearchProviderStub extends NotConfiguredProvider {
  name = 'trends'
}

/** Configurable failing provider for tests */
export class FlakyResearchProvider implements ResearchProvider {
  name = 'flaky'
  status: ProviderStatus = 'READY'
  constructor(
    private failTimes: number,
    private succeedWith: ResearchResult[] = [],
  ) {}
  private attempts = 0

  async search(_input: ResearchInput): Promise<ResearchResult[]> {
    this.attempts += 1
    if (this.attempts <= this.failTimes) {
      throw new Error(`flaky_provider_attempt_${this.attempts}`)
    }
    return this.succeedWith
  }
}

export class AlwaysFailResearchProvider implements ResearchProvider {
  name = 'always_fail'
  status: ProviderStatus = 'READY'
  async search(): Promise<ResearchResult[]> {
    throw new Error('always_fail')
  }
}
