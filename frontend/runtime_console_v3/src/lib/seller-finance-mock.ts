function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export function sellerFinanceRevenueMock() {
  const rows = [
    { date: daysAgo(0), orders: 12, gross_cents: 120_000, fees_cents: 12_000, net_cents: 108_000, status: "received" },
    { date: daysAgo(1), orders: 8, gross_cents: 80_000, fees_cents: 8_000, net_cents: 72_000, status: "received" },
    { date: daysAgo(2), orders: 5, gross_cents: 45_000, fees_cents: 4_500, net_cents: 40_500, status: "received" },
  ];
  return {
    rows,
    totals: {
      gross_cents: rows.reduce((s, r) => s + r.gross_cents, 0),
      fees_cents: rows.reduce((s, r) => s + r.fees_cents, 0),
      net_cents: rows.reduce((s, r) => s + r.net_cents, 0),
      orders: rows.reduce((s, r) => s + r.orders, 0),
    },
    period: "30d",
  };
}

export function sellerFinancePayoutsMock() {
  return {
    pending_cents: 45_000,
    completed_cents: 320_000,
    completed_count: 28,
    stripe_onboarding_complete: true,
    stripe_account_id: "acct_demo123",
  };
}

export function sellerFinanceStripeMock() {
  return {
    account_id: "acct_demo123",
    onboarding_complete: true,
    open_disputes: 0,
    stripe_orders_count: 24,
    stripe_revenue_cents: 280_000,
  };
}

export function sellerFinancePixMock() {
  return {
    pix_key_configured: true,
    pending_count: 2,
    confirmed_count: 18,
    revenue_cents: 95_000,
  };
}

export function sellerNotificationSettingsMock() {
  return {
    settings: {
      new_order: ["email", "push"],
      payment_received: ["email"],
      ticket_created: ["email", "push"],
      low_stock: ["email"],
      daily_summary: ["email"],
    },
  };
}
