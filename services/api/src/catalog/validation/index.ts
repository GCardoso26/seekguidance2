export type {
  ConsistencyCheckId,
  ConsistencyViolation,
  ConsistencyReport,
  ConsistencyValidator,
} from "./ConsistencyValidator.js";
export { CompositeConsistencyValidator } from "./ConsistencyValidator.js";
export { CatalogConsistencyValidator } from "./CatalogConsistencyValidator.js";
export {
  evaluateShadowComparison,
  DEFAULT_SHADOW_EXPECTED,
  type ShadowComparisonActual,
  type ShadowComparisonExpected,
  type ShadowComparisonResult,
  type ShadowDivergence,
} from "./ShadowComparison.js";
