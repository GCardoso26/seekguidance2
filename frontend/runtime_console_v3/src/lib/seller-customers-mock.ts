export function sellerCustomersMock() {
  return {
    customers: [
      {
        customer_id: "cust-1",
        display_name: "João Silva",
        email: "joao@email.com",
        handle: "joaomtg",
        city: "São Paulo",
        total_spent_cents: 245_000,
        order_count: 12,
        last_order_at: new Date().toISOString(),
        segment: "high_spender",
      },
      {
        customer_id: "cust-2",
        display_name: "Maria Lima",
        email: "maria@email.com",
        handle: "marialima",
        city: "Rio de Janeiro",
        total_spent_cents: 89_000,
        order_count: 4,
        last_order_at: new Date(Date.now() - 86400000).toISOString(),
        segment: "frequent",
      },
    ],
    total: 2,
    page: 1,
    limit: 25,
  };
}

export function sellerCustomerGamificationMock() {
  return {
    gamification: { total_xp: 1250, level: 5, league_tier: "silver" },
    badges: [{ code: "first_purchase", name: "Primeira Compra", icon_url: null, earned_at: new Date().toISOString() }],
  };
}
