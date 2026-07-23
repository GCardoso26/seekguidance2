/**
 * Performance V2 helpers — native-app feel (Epic 17).
 * Utilities only; no new infra BC.
 */

export const PERFORMANCE_PRESETS = {
  portalRevalidate: 60,
  cardRevalidate: 300,
  homeStaleMs: 45_000,
  listOverscan: 8,
  imagePrioritySlots: 2,
} as const;

/** Prefetch hint for portal routes (call from client on hover/focus). */
export function prefetchPortal(router: { prefetch: (href: string) => void }, slug: string) {
  router.prefetch(`/${slug}`);
  router.prefetch(`/${slug}/cards`);
  router.prefetch(`/${slug}/expansions`);
}

/** Intersection observer options for lazy sections. */
export const LAZY_SECTION_IO: IntersectionObserverInit = {
  rootMargin: "200px 0px",
  threshold: 0.01,
};

export type CacheScope = "portal" | "card" | "collection" | "marketplace";

export function cacheKey(scope: CacheScope, id: string): string {
  return `judgetcg:perf:${scope}:${id}`;
}
