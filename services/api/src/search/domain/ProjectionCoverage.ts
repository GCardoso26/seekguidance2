/**
 * ProjectionCoverage — Catalog SoT count vs Search projection count.
 * Catalog count is injected (ops/CLI); Search never queries Catalog repos.
 */
export interface ProjectionCoverage {
  catalogCards: number;
  projectionCards: number;
  /** 0–100 */
  coveragePct: number;
  projection: string;
  measuredAt: string;
}

export function computeProjectionCoverage(input: {
  catalogCards: number;
  projectionCards: number;
  projection: string;
  measuredAt?: string;
}): ProjectionCoverage {
  const catalogCards = Math.max(0, input.catalogCards);
  const projectionCards = Math.max(0, input.projectionCards);
  const coveragePct =
    catalogCards === 0
      ? projectionCards === 0
        ? 100
        : 0
      : Math.min(100, (projectionCards / catalogCards) * 100);
  return {
    catalogCards,
    projectionCards,
    coveragePct: Math.round(coveragePct * 100) / 100,
    projection: input.projection,
    measuredAt: input.measuredAt ?? new Date().toISOString(),
  };
}

/**
 * ProjectionDrift — how stale Search is vs Catalog activity.
 */
export interface ProjectionDrift {
  /** Unapplied / pending events approx (or known delta). */
  changedSinceProjection: number;
  lastProjectionAt: string | null;
  lastCatalogUpdateAt: string | null;
  lagMs: number | null;
  projection: string;
  measuredAt: string;
}

export function computeProjectionDrift(input: {
  changedSinceProjection: number;
  lastProjectionAt: string | null;
  lastCatalogUpdateAt: string | null;
  lagMs: number | null;
  projection: string;
  measuredAt?: string;
}): ProjectionDrift {
  return {
    changedSinceProjection: Math.max(0, input.changedSinceProjection),
    lastProjectionAt: input.lastProjectionAt,
    lastCatalogUpdateAt: input.lastCatalogUpdateAt,
    lagMs: input.lagMs,
    projection: input.projection,
    measuredAt: input.measuredAt ?? new Date().toISOString(),
  };
}
