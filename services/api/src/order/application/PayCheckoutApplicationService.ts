import type { TransactionManager } from "../../platform/transaction/types.js";
import type { InventoryRepository } from "../../marketplace/domain/InventoryRepository.js";
import type { MarketplaceQueryService } from "../../marketplace/read/MarketplaceQueryService.js";
import type { RequestPaymentApplicationService } from "../../payment/application/RequestPaymentApplicationService.js";
import type { Payment } from "../../payment/domain/models.js";
import type { CheckoutSessionRepository } from "../domain/CheckoutSessionRepository.js";
import type { OrderRepository } from "../domain/OrderRepository.js";
import type { CheckoutSession, Order } from "../domain/models.js";
import type { HoldReservationApplicationService } from "../reservation/application/HoldReservationApplicationService.js";
import type { ReleaseReservationApplicationService } from "../reservation/application/ReleaseReservationApplicationService.js";

export interface PayCheckoutInput {
  requestId: string;
  checkoutSessionId: string;
  buyerId: string;
}

export interface PayCheckoutResult {
  session: CheckoutSession;
  order: Order;
  payment: Payment;
  providerTimeout: boolean;
}

/**
 * Reserve-first + RequestPayment (Sprint 5.5).
 * Does NOT call Fake/Stripe/Webhook — completion via webhook + SettlePayment.
 */
export class PayCheckoutApplicationService {
  constructor(
    private readonly tx: TransactionManager,
    private readonly checkouts: CheckoutSessionRepository,
    private readonly orders: OrderRepository,
    private readonly queries: MarketplaceQueryService,
    private readonly inventory: InventoryRepository,
    private readonly marketplaceTx: TransactionManager,
    private readonly holdReservation: HoldReservationApplicationService,
    private readonly releaseReservation: ReleaseReservationApplicationService,
    private readonly requestPayment: RequestPaymentApplicationService,
  ) {}

  async execute(input: PayCheckoutInput): Promise<PayCheckoutResult> {
    const session = await this.tx.runInTransaction((t) =>
      this.checkouts.findById(t, input.checkoutSessionId),
    );
    if (!session) throw new Error("checkout_not_found");
    if (session.buyerId !== input.buyerId) throw new Error("checkout_forbidden");
    if (session.status !== "CREATED" && session.status !== "PAYMENT_PENDING") {
      throw new Error("checkout_not_payable");
    }
    if (!session.orderId) throw new Error("checkout_missing_order");

    const order = await this.tx.runInTransaction((t) =>
      this.orders.findById(t, session.orderId!),
    );
    if (!order) throw new Error("order_not_found");
    if (order.status !== "PENDING") throw new Error("order_not_pending");

    const payRequestId = `${input.requestId}:pay`;

    // Retry while already awaiting webhook — idempotent RequestPayment.
    if (session.status === "PAYMENT_PENDING") {
      const requested = await this.requestPayment.execute({
        requestId: payRequestId,
        orderId: order.id,
        amountCents: order.totalAmountCents,
        currency: order.currency,
        reservationIds: [],
      });
      return {
        session,
        order,
        payment: requested.payment,
        providerTimeout: requested.providerTimeout,
      };
    }

    const reservationIds: string[] = [];
    for (const item of order.items) {
      const listing = await this.queries.getListing(item.listingId);
      if (!listing || listing.status !== "active") {
        throw new Error("listing_unavailable");
      }
      if (!listing.inventoryItemId) {
        throw new Error("listing_missing_inventory");
      }

      let availableQuantity = listing.quantity;
      const inv = await this.marketplaceTx.runInTransaction((t) =>
        this.inventory.findById(t, listing.inventoryItemId!),
      );
      if (inv) availableQuantity = inv.quantity;

      const hold = await this.holdReservation.execute({
        requestId: `${input.requestId}:hold:${item.id}`,
        listingId: item.listingId,
        inventoryItemId: listing.inventoryItemId,
        buyerId: input.buyerId,
        quantity: item.quantity,
        availableQuantity,
      });

      if (hold.outcome === "rejected") {
        for (const id of reservationIds) {
          await this.releaseReservation.execute({
            requestId: `${input.requestId}:rollback:${id}`,
            reservationId: id,
          });
        }
        await this.tx.runInTransaction((t) =>
          this.checkouts.updateStatus(t, session.id, "FAILED"),
        );
        throw new Error(`reservation_rejected:${hold.reason}`);
      }
      reservationIds.push(hold.reservation.id);
    }

    await this.tx.runInTransaction((t) =>
      this.checkouts.updateStatus(t, session.id, "RESERVED"),
    );

    const requested = await this.requestPayment.execute({
      requestId: payRequestId,
      orderId: order.id,
      amountCents: order.totalAmountCents,
      currency: order.currency,
      reservationIds,
    });

    await this.tx.runInTransaction((t) =>
      this.checkouts.updateStatus(t, session.id, "PAYMENT_PENDING"),
    );

    const updatedSession = await this.tx.runInTransaction((t) =>
      this.checkouts.findById(t, session.id),
    );

    return {
      session: updatedSession!,
      order,
      payment: requested.payment,
      providerTimeout: requested.providerTimeout,
    };
  }
}
