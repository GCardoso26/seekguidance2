import type { JobEnvelope } from "../../platform/jobs/JobEnvelope.js";

/** Command payload — SyncSetCommand (jobType). */
export interface SyncSetCommandPayload {
  gameId: string;
  code: string;
  name: string;
  releaseDate?: string | null;
  providerSetId: string;
  mappingMetadata?: Record<string, unknown>;
}

export type SyncSetCommand = JobEnvelope<SyncSetCommandPayload>;

export function isSyncSetCommand(env: JobEnvelope): env is SyncSetCommand {
  return env.jobType === "SyncSetCommand";
}
