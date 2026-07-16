export type SearchProjectionStatus = "building" | "live" | "draining" | "retired";

/**
 * Versioned Meilisearch index identity — mirror Catalog projection discipline.
 * Rebuild: cards_v2 building → flip live → drain cards_v1 → retire.
 */
export interface SearchProjectionVersion {
  name: string;
  version: number;
  status: SearchProjectionStatus;
}

export function projectionName(version: number): string {
  return `cards_v${version}`;
}

export function parseProjectionVersion(name: string): number | null {
  const m = /^cards_v(\d+)$/.exec(name);
  return m ? Number(m[1]) : null;
}

export function createProjectionVersion(
  version: number,
  status: SearchProjectionStatus = "building",
): SearchProjectionVersion {
  return { name: projectionName(version), version, status };
}
