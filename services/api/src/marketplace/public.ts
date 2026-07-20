/**
 * Public surface for Marketplace BC (ADR-011).
 * Other BCs may import ONLY from this barrel (or documented application entrypoints).
 */
export {
  MarketplaceOrchestrator,
  createMarketplaceOrchestrator,
  type PublishProductListingCommand,
  type PublishProductListingResult,
} from "./application/MarketplaceOrchestrator.js";
export { publishProductListingIdempotent } from "./application/publishProductListingIdempotent.js";
export {
  ListingPublicQuery,
  createListingPublicQuery,
  type ListingPublicDTO,
} from "./application/ListingPublicQuery.js";
