export function sellerTicketsMock(status?: string) {
  const tickets = [
    {
      id: "ticket-1",
      subject: "Pedido não recebido",
      category: "shipping",
      priority: "high",
      status: "open",
      customer_name: "João Silva",
      created_at: new Date().toISOString(),
    },
    {
      id: "ticket-2",
      subject: "Dúvida sobre pagamento PIX",
      category: "payment",
      priority: "medium",
      status: "in_progress",
      customer_name: "Maria Lima",
      created_at: new Date().toISOString(),
    },
  ];
  const filtered = status ? tickets.filter((t) => t.status === status) : tickets;
  return { tickets: filtered, total: filtered.length, page: 1, limit: 25 };
}
