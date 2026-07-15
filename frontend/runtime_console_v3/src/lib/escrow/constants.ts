/** Taxa de escrow — 3% do valor dos produtos (sem frete). */
export const ESCROW_FEE_RATE = 0.03;

export const ESCROW_DEADLINES = {
  paymentHours: 24,
  shippingHours: 48,
  confirmationHours: 72,
  autoReleaseDays: 7,
} as const;

export const ESCROW_STATUS_LABELS: Record<string, string> = {
  pending_payment: "Aguardando pagamento",
  payment_received: "Compra protegida (valor retido)",
  shipped: "Enviado",
  delivered: "Aguardando confirmação",
  disputed: "Em disputa",
  resolved: "Disputa resolvida",
  released_to_seller: "Concluído",
  refunded_to_buyer: "Reembolsado",
  cancelled: "Cancelado",
};
