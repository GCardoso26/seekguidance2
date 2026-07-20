import type { Pool } from "pg";
import type { PlatformDomainEvent } from "../../platform/events/DomainEvent.js";
import type { ProjectionConsumer } from "../../platform/projections/ProjectionWorker.js";
import { createOrdersService } from "../application/OrdersService.js";
import { projectOrderSnapshot } from "./OrdersProjections.js";

/**
 * Listens to CheckoutCompleted — creates Order via public handoff (no checkout SQL).
 */
export class CreateOrderFromCheckoutProjection implements ProjectionConsumer {
  readonly name = "CreateOrderFromCheckoutProjection";

  constructor(private readonly pool: Pool) {}

  supports(event: PlatformDomainEvent): boolean {
    return (
      event.eventType === "CheckoutCompleted.v1" ||
      (event.eventType === "OrderCreated.v1" && event.aggregateType === "checkout_session")
    );
  }

  async project(event: PlatformDomainEvent): Promise<void> {
    const sessionId =
      event.aggregateType === "checkout_session"
        ? event.aggregateId
        : ((event.payload as { sessionId?: string }).sessionId ?? event.aggregateId);

    const orders = createOrdersService(this.pool);
    const result = await orders.createFromCheckoutSession(sessionId, {
      correlationId: event.correlationId,
      requestId: event.eventId,
    });
    if (result.created) {
      await projectOrderSnapshot(this.pool, result.order);
    }
  }
}
