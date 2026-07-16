/**
 * Outcome of an aggregate write — Application Service uses this instead of recomputing diffs.
 */
export type UpsertOutcome = "created" | "updated" | "unchanged";

export interface RepositoryResult<T> {
  outcome: UpsertOutcome;
  entity: T;
  /** null on create */
  previousVersion: number | null;
  currentVersion: number;
}

export function isWrite(result: RepositoryResult<unknown>): boolean {
  return result.outcome === "created" || result.outcome === "updated";
}

export function emitEventFor(result: RepositoryResult<unknown>): boolean {
  return isWrite(result);
}
