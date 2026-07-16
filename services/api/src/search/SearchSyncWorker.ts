import { eventBus } from "../platform/event-bus/EventBus.js";
import { InMemoryConsumerOffsetRepository } from "../platform/outbox/ConsumerOffsetRepository.js";
import { createLogger } from "../platform/logging/logger.js";
import type { DomainEvent } from "../shared/events/types.js";
import { SearchEventConsumer } from "./consumer/SearchEventConsumer.js";
import type { SearchProjectionRepository } from "./domain/SearchProjectionRepository.js";
import type { SearchProjectionVersion } from "./domain/SearchProjectionVersion.js";
import { InMemorySearchProjectionRepository } from "./persistence/InMemorySearchProjectionRepository.js";
import { createSearchProjectionFromEnv } from "./persistence/MeilisearchSearchProjectionRepository.js";
import { ProjectionManager } from "./ProjectionManager.js";

const log = createLogger("search-sync");

/**
 * SearchSyncWorker — wires Event Bus (local) to thin SearchEventConsumer.
 * Index lifecycle: ProjectionManager. Never mutates Catalog.
 */
export class SearchSyncWorker {
  private readonly projection: SearchProjectionRepository;
  private readonly manager: ProjectionManager;
  private readonly consumer: SearchEventConsumer;
  private unsubscribe?: () => void;
  private countCache = 0;

  constructor(projection?: SearchProjectionRepository) {
    this.projection =
      projection ?? createSearchProjectionFromEnv() ?? new InMemorySearchProjectionRepository();
    this.manager = new ProjectionManager(this.projection);
    this.consumer = new SearchEventConsumer(
      this.projection,
      new InMemoryConsumerOffsetRepository(),
      undefined,
      this.manager,
    );
  }

  start(): void {
    this.unsubscribe = eventBus.subscribe("*", (event) => this.onEvent(event));
    void this.manager.ensureIndexes().catch((err) => {
      log.warn({ err: String(err) }, "search_ensure_index_failed");
    });
    log.info(
      { projection: this.projection.getVersion().name, alias: this.manager.getLiveAlias() },
      "search_sync_started",
    );
  }

  stop(): void {
    this.unsubscribe?.();
  }

  getProjection(): SearchProjectionVersion {
    return this.projection.getVersion();
  }

  getRepository(): SearchProjectionRepository {
    return this.projection;
  }

  getManager(): ProjectionManager {
    return this.manager;
  }

  beginRebuild(nextVersion: number): SearchProjectionVersion {
    void this.manager.beginRebuild(nextVersion);
    this.countCache = 0;
    return this.projection.getVersion();
  }

  activateProjection(): void {
    void this.manager.swapAlias();
  }

  documentCount(): number {
    return this.countCache;
  }

  async documentCountAsync(): Promise<number> {
    this.countCache = await this.projection.documentCount();
    return this.countCache;
  }

  private async onEvent(event: DomainEvent): Promise<void> {
    const result = await this.consumer.handle(event);
    if (result === "applied") {
      this.countCache = await this.projection.documentCount();
    }
  }
}

export const searchSyncWorker = new SearchSyncWorker();
