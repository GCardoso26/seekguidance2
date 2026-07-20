export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

export type OrderPaymentStatus =
  | "unpaid"
  | "pending"
  | "paid"
  | "failed"
  | "refund_requested"
  | "refunded";

export type TimelineEventType =
  | "OrderCreated"
  | "PaymentApproved"
  | "PreparingShipment"
  | "Shipped"
  | "Delivered"
  | "Cancelled"
  | "RefundRequested"
  | "Refunded";

export interface OrderItem {
  id: string;
  orderId: string;
  listingId: string | null;
  productVariantId: string | null;
  catalogVariantId: string | null;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
  currency: string;
}

export interface OrderTimelineEntry {
  id: string;
  orderId: string;
  eventType: TimelineEventType;
  payload: Record<string, unknown>;
  occurredAt: Date;
}

export interface Order {
  id: string;
  buyerId: string;
  sellerId: string | null;
  status: OrderStatus;
  paymentStatus: OrderPaymentStatus;
  checkoutSessionId: string | null;
  checkoutPaymentId: string | null;
  currency: string;
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  shipmentRef: string | null;
  items: OrderItem[];
  createdAt: Date;
  updatedAt: Date;
}
