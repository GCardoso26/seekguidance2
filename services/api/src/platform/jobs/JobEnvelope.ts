import type { JobPriority } from "../bullmq/queues.js";

/**
 * Standard job envelope — BullMQ carries COMMANDS, never Domain Events.
 * @see FOUNDATION_FREEZE §12.2
 */
export type CatalogCommandType =
  | "SyncSetCommand"
  | "SyncCardCommand"
  | "SyncVariantCommand";

export type JobType = CatalogCommandType | string;

export interface JobEnvelope<TPayload = unknown> {
  jobType: JobType;
  jobVersion: number;
  requestId: string;
  correlationId: string;
  providerId: string;
  gameCode: string;
  priority: JobPriority;
  /** Current attempt (1-based). */
  attempt: number;
  payload: TPayload;
}

export type SyncJobStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "retry"
  | "dead";

export interface SyncJobState {
  jobId: string;
  status: SyncJobStatus;
  jobType: JobType;
  attempt: number;
  lastError?: string;
  updatedAt: string;
}

export function createJobEnvelope<TPayload>(
  jobType: JobType,
  payload: TPayload,
  opts: {
    requestId: string;
    correlationId?: string;
    providerId: string;
    gameCode: string;
    priority?: JobPriority;
    attempt?: number;
    jobVersion?: number;
  },
): JobEnvelope<TPayload> {
  return {
    jobType,
    jobVersion: opts.jobVersion ?? 1,
    requestId: opts.requestId,
    correlationId: opts.correlationId ?? opts.requestId,
    providerId: opts.providerId,
    gameCode: opts.gameCode,
    priority: opts.priority ?? "NORMAL",
    attempt: opts.attempt ?? 1,
    payload,
  };
}
