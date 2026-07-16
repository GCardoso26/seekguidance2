import type { JobEnvelope } from "../../platform/jobs/JobEnvelope.js";
import type { CatalogVariantUpsert } from "../domain/models.js";

/** Command payload — SyncVariantCommand (jobType). */
export interface SyncVariantCommandPayload {
  variant: CatalogVariantUpsert;
  mapping: {
    providerVariantId: string;
    providerCardId?: string | null;
    metadata?: Record<string, unknown>;
  };
}

export type SyncVariantCommand = JobEnvelope<SyncVariantCommandPayload>;

export function isSyncVariantCommand(env: JobEnvelope): env is SyncVariantCommand {
  return env.jobType === "SyncVariantCommand";
}
