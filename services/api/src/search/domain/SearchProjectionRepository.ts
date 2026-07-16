import type { SearchCardDocument, SearchFilters, SearchResult } from "./SearchDocument.js";
import type { SearchProjectionVersion } from "./SearchProjectionVersion.js";
import type { ProjectionHealth } from "./ProjectionHealth.js";
import type { ProjectionLag } from "./ProjectionHealth.js";

/**
 * Port — Search read model only.
 * NEVER queries Catalog Providers. NEVER writes Catalog tables.
 */
export interface SearchProjectionRepository {
  getVersion(): SearchProjectionVersion;
  beginRebuild(nextVersion: number): Promise<SearchProjectionVersion>;
  activateProjection(): Promise<SearchProjectionVersion>;
  retireProjection(name: string): Promise<void>;

  upsert(doc: SearchCardDocument): Promise<void>;
  upsertMany(docs: SearchCardDocument[]): Promise<void>;
  delete(id: string): Promise<void>;
  get(id: string): Promise<SearchCardDocument | null>;
  search(filters: SearchFilters): Promise<SearchResult>;
  documentCount(): Promise<number>;

  ensureIndex(): Promise<void>;
  isReachable(): Promise<boolean>;

  getLag(): ProjectionLag;
  recordAppliedEvent(eventId: string, occurredAt: string): void;
  getHealth(): Promise<ProjectionHealth>;
}
