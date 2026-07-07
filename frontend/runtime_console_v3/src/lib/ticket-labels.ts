export const TICKET_STATUS_LABELS: Record<string, string> = {
  open: "Aberto",
  in_progress: "Em atendimento",
  waiting_customer: "Aguardando cliente",
  resolved: "Resolvido",
  closed: "Fechado",
};

export const TICKET_PRIORITY_LABELS: Record<string, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  urgent: "Urgente",
};

export const TICKET_CATEGORY_LABELS: Record<string, string> = {
  order: "Pedido",
  payment: "Pagamento",
  shipping: "Envio",
  product: "Produto",
  other: "Outro",
};

export function ticketStatusLabel(status: string): string {
  return TICKET_STATUS_LABELS[status] ?? status;
}
