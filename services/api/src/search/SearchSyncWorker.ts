import { eventBus } from "../platform/event-bus/EventBus.js";
import { createLogger } from "../platform/logging/logger.js";
import type { DomainEvent } from "../shared/events/types.js";

const log = createLogger("search-sync");

export type IndexProjectionStatus = "building" | "live" | "draining" | "retired";

export interface IndexProjection {
  name: string; // e.g. cards_v1
  version: number;
  status: IndexProjectionStatus;
}

/**
 * SearchSyncWorker — sole writer to Meilisearch (Phase 1: in-memory projection).
 * Subscribes to multiple domain events; never called by CatalogProviders directly.
 */
export class SearchSyncWorker {
  private projection: IndexProjection = { name: "cards_v1", version: 1, status: "live" };
  private documents = new Map<string, Record<string, unknown>>();
  private unsubscribe?: () => void;

  start(): void {
    this.unsubscribe = eventBus.subscribe("*", (event) => this.onEvent(event));
    log.info({ projection: this.projection.name }, "search_sync_started");
  }

  stop(): void {
    this.unsubscribe?.();
  }

  getProjection(): IndexProjection {
    return { ...this.projection };
  }

  /** Blue/green style: build cards_vN then flip live. */
  beginRebuild(nextVersion: number): IndexProjection {
    this.projection = {
      name: `cards_v${nextVersion}`,
      version: nextVersion,
      status: "building",
    };
    this.documents = new Map();
    return this.getProjection();
  }

  activateProjection(): void {
    this.projection.status = "live";
  }

  documentCount(): number {
    return this.documents.size;
  }

  private async onEvent(event: DomainEvent): Promise<void> {
    switch (event.event) {
      case "CardUpdated":
      case "PriceUpdated":
      case "MediaUpdated":
      case "SetUpdated":
      case "MarketplaceListingUpdated":
        this.documents.set(event.aggregateId, {
          id: event.aggregateId,
          event: event.event,
          version: event.version,
          ...event.payload,
          updatedAt: event.occurredAt,
          projection: this.projection.name,
        });
        log.debug(
          { event: event.event, aggregateId: event.aggregateId, projection: this.projection.name },
          "search_doc_upsert",
        );
        break;
      default:
        break;
    }
  }
}

export const searchSyncWorker = new SearchSyncWorker();
