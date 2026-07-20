/** Platform governance barrel. */
export type { PlatformDomainEvent } from "./events/DomainEvent.js";
export { DomainEventFactory, domainEventFactory } from "./events/DomainEventFactory.js";
export { EventRegistry, eventRegistry } from "./events/EventRegistry.js";
export {
  IdempotentCommandHandler,
  createIdempotentHandler,
} from "./idempotency/IdempotentCommandHandler.js";
export { CommandBus, QueryBus, CQRS_PIPELINE } from "./cqrs/index.js";
export {
  FeatureFlagService,
  createFeatureFlagService,
  InMemoryFeatureFlagService,
} from "./feature-flags/FeatureFlagService.js";
export { ProjectionWorker, createProjectionWorker } from "./projections/ProjectionWorker.js";
export type { ProjectionConsumer } from "./projections/ProjectionWorker.js";
export { OUTBOX_FLOW } from "./outbox/governance.js";
export { obsFields, type ObservabilityContext } from "./observability/context.js";
