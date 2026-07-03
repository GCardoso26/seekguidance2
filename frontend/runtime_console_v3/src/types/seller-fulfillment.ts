/** Estados oficiais — fulfillment.md State Machine */
export type FulfillmentStatus =
  | "Pending"
  | "Picking"
  | "Picked"
  | "Packing"
  | "Packed"
  | "ReadyToShip"
  | "Shipped"
  | "InTransit"
  | "Delivered"
  | "Completed"
  | "Delayed"
  | "Lost"
  | "Returned"
  | "Cancelled"
  | "Exception"
  | "Failed";

export type FulfillmentCommand =
  | "start_picking"
  | "complete_picking"
  | "start_packing"
  | "complete_packing"
  | "ready_to_ship"
  | "generate_label"
  | "confirm_ship"
  | "confirm_delivery"
  | "complete"
  | "cancel";

export type FulfillmentTimelineEntry = {
  from_status: string | null;
  to_status: string;
  event_type: string | null;
  actor_id: string | null;
  created_at: string;
};

export type SellerFulfillmentProjection = {
  fulfillment_id: string;
  order_id: string;
  store_id: string;
  fulfillment_status: FulfillmentStatus;
  order_status: string;
  carrier: string | null;
  shipment_tracking_code: string | null;
  order_tracking_code: string | null;
  label_url: string | null;
  shipment_status: string | null;
  timeline: FulfillmentTimelineEntry[];
};

export const FULFILLMENT_STEPS: { status: FulfillmentStatus; label: string }[] = [
  { status: "Pending", label: "Aguardando" },
  { status: "Picking", label: "Separação" },
  { status: "Picked", label: "Separado" },
  { status: "Packing", label: "Embalagem" },
  { status: "Packed", label: "Embalado" },
  { status: "ReadyToShip", label: "Pronto p/ envio" },
  { status: "Shipped", label: "Enviado" },
  { status: "InTransit", label: "Em trânsito" },
  { status: "Delivered", label: "Entregue" },
  { status: "Completed", label: "Concluído" },
];

export function nextFulfillmentCommand(status: FulfillmentStatus): FulfillmentCommand | null {
  const map: Partial<Record<FulfillmentStatus, FulfillmentCommand>> = {
    Pending: "start_picking",
    Picking: "complete_picking",
    Picked: "start_packing",
    Packing: "complete_packing",
    Packed: "ready_to_ship",
    ReadyToShip: "confirm_ship",
    Shipped: "confirm_delivery",
    InTransit: "confirm_delivery",
    Delivered: "complete",
  };
  return map[status] ?? null;
}

export function fulfillmentStepIndex(status: FulfillmentStatus): number {
  const idx = FULFILLMENT_STEPS.findIndex((s) => s.status === status);
  if (idx >= 0) return idx;
  if (status === "InTransit") return FULFILLMENT_STEPS.findIndex((s) => s.status === "Shipped");
  return 0;
}
