import { getIdGenerator } from "../../shared/ids/IdGenerator.js";
import type {
  Order,
  OrderItem,
  OrderStatus,
  TimelineEventType,
} from "./types.js";

export interface CreateOrderItemInput {
  listingId?: string | null;
  productVariantId?: string | null;
  catalogVariantId?: string | null;
  quantity: number;
  unitPriceCents: number;
  currency?: string;
}

export interface CreateOrderInput {
  buyerId: string;
  sellerId?: string | null;
  checkoutSessionId: string;
  checkoutPaymentId?: string | null;
  currency?: string;
  subtotalCents: number;
  discountCents?: number;
  totalCents: number;
  items: CreateOrderItemInput[];
  /** Checkout already captured payment → start as PAID */
  alreadyPaid?: boolean;
}

/**
 * Order Aggregate — small surface; timeline events returned for persistence (append-only).
 */
export class OrderAggregate {
  private timelinePending: Array<{
    eventType: TimelineEventType;
    payload: Record<string, unknown>;
  }> = [];

  private constructor(private state: Order) {}

  static create(input: CreateOrderInput): OrderAggregate {
    const id = getIdGenerator().generate();
    const now = new Date();
    const items: OrderItem[] = input.items.map((i) => ({
      id: getIdGenerator().generate(),
      orderId: id,
      listingId: i.listingId ?? null,
      productVariantId: i.productVariantId ?? null,
      catalogVariantId: i.catalogVariantId ?? null,
      quantity: i.quantity,
      unitPriceCents: i.unitPriceCents,
      totalCents: i.quantity * i.unitPriceCents,
      currency: i.currency ?? input.currency ?? "BRL",
    }));

    const paid = Boolean(input.alreadyPaid);
    const agg = new OrderAggregate({
      id,
      buyerId: input.buyerId,
      sellerId: input.sellerId ?? null,
      status: paid ? "PAID" : "PENDING",
      paymentStatus: paid ? "paid" : "unpaid",
      checkoutSessionId: input.checkoutSessionId,
      checkoutPaymentId: input.checkoutPaymentId ?? null,
      currency: input.currency ?? "BRL",
      subtotalCents: input.subtotalCents,
      discountCents: input.discountCents ?? 0,
      totalCents: input.totalCents,
      shipmentRef: null,
      items,
      createdAt: now,
      updatedAt: now,
    });
    agg.append("OrderCreated", {
      buyerId: input.buyerId,
      checkoutSessionId: input.checkoutSessionId,
      totalCents: input.totalCents,
    });
    if (paid) {
      agg.append("PaymentApproved", {
        checkoutPaymentId: input.checkoutPaymentId,
      });
    }
    return agg;
  }

  static rehydrate(order: Order): OrderAggregate {
    return new OrderAggregate({
      ...order,
      items: order.items.map((i) => ({ ...i })),
    });
  }

  get id(): string {
    return this.state.id;
  }

  snapshot(): Order {
    return {
      ...this.state,
      items: this.state.items.map((i) => ({ ...i })),
    };
  }

  drainTimeline(): Array<{ eventType: TimelineEventType; payload: Record<string, unknown> }> {
    const out = [...this.timelinePending];
    this.timelinePending = [];
    return out;
  }

  markPaid(payload: Record<string, unknown> = {}): void {
    this.assertNotTerminal();
    if (this.state.status === "PAID") return;
    this.state.status = "PAID";
    this.state.paymentStatus = "paid";
    this.touch();
    this.append("PaymentApproved", payload);
  }

  markProcessing(): void {
    this.requireStatus("PAID");
    this.state.status = "PROCESSING";
    this.touch();
    this.append("PreparingShipment", {});
  }

  markShipped(shipmentRef?: string): void {
    if (this.state.status !== "PAID" && this.state.status !== "PROCESSING") {
      throw new Error(`order_invalid_transition:${this.state.status}->SHIPPED`);
    }
    this.state.status = "SHIPPED";
    if (shipmentRef) this.state.shipmentRef = shipmentRef;
    this.touch();
    this.append("Shipped", { shipmentRef: this.state.shipmentRef });
  }

  markDelivered(): void {
    this.requireStatus("SHIPPED");
    this.state.status = "DELIVERED";
    this.touch();
    this.append("Delivered", {});
  }

  cancel(reason?: string): void {
    this.assertNotTerminal();
    if (this.state.status === "DELIVERED") throw new Error("order_cannot_cancel_delivered");
    this.state.status = "CANCELLED";
    this.touch();
    this.append("Cancelled", { reason: reason ?? null });
  }

  requestRefund(): void {
    if (this.state.paymentStatus !== "paid" && this.state.paymentStatus !== "refund_requested") {
      throw new Error("order_not_paid_for_refund");
    }
    this.state.paymentStatus = "refund_requested";
    this.touch();
    this.append("RefundRequested", {});
  }

  markRefunded(): void {
    this.state.status = "REFUNDED";
    this.state.paymentStatus = "refunded";
    this.touch();
    this.append("Refunded", {});
  }

  private requireStatus(status: OrderStatus): void {
    if (this.state.status !== status) {
      throw new Error(`order_invalid_transition:${this.state.status}->expected_${status}`);
    }
  }

  private assertNotTerminal(): void {
    if (
      this.state.status === "CANCELLED" ||
      this.state.status === "REFUNDED" ||
      this.state.status === "DELIVERED"
    ) {
      throw new Error(`order_terminal:${this.state.status}`);
    }
  }

  private append(eventType: TimelineEventType, payload: Record<string, unknown>): void {
    this.timelinePending.push({ eventType, payload });
  }

  private touch(): void {
    this.state.updatedAt = new Date();
  }
}
