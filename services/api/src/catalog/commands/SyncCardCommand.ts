import type { JobEnvelope } from "../../platform/jobs/JobEnvelope.js";
import type { CatalogCardUpsert } from "../domain/models.js";

/** Command payload — SyncCardCommand (jobType). */
export interface SyncCardCommandPayload {
  card: CatalogCardUpsert;
  mapping: {
    providerCardId: string;
    providerSetId?: string | null;
    metadata?: Record<string, unknown>;
  };
}

export type SyncCardCommand = JobEnvelope<SyncCardCommandPayload>;

export function isSyncCardCommand(env: JobEnvelope): env is SyncCardCommand {
  return env.jobType === "SyncCardCommand";
}
