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

export function sellerFinanceReconciliationMock() {
  return {
    items: [
      {
        payment_id: "pay-001",
        shop_order_id: "ord-001",
        payment_status: "Approved",
        payment_amount: 15000,
        store_amount_cents: 13500,
        order_status: "paid",
        order_amount: 15000,
        stripe_transfer_id: "tr_abc",
        reconciliation_status: "ok",
      },
      {
        payment_id: "pay-002",
        shop_order_id: "ord-002",
        payment_status: "Approved",
        payment_amount: 8000,
        store_amount_cents: 7200,
        order_status: "paid",
        order_amount: 8000,
        stripe_transfer_id: null,
        reconciliation_status: "transfer_pending",
      },
    ],
    total: 2,
    issues_count: 1,
    issues: [],
    healthy: false,
  };
}

export function sellerFinanceChargebacksMock() {
  return {
    open_count: 1,
    items: [
      {
        id: "cb-001",
        payment_id: "pay-003",
        shop_order_id: "ord-003",
        stripe_dispute_id: "dp_demo",
        status: "opened",
        amount_cents: 12000,
        reason: "fraudulent",
        evidence_due_by: new Date(Date.now() + 7 * 86400000).toISOString(),
        opened_at: new Date().toISOString(),
        resolved_at: null,
        payment_method: "stripe",
      },
    ],
  };
}

export function sellerFinanceAuditTrailMock() {
  return {
    events: [
      {
        id: "ev-001",
        payment_id: "pay-001",
        from_status: "Captured",
        to_status: "Approved",
        event_type: "PaymentApproved",
        created_at: new Date().toISOString(),
        shop_order_id: "ord-001",
        amount_cents: 15000,
        payment_method: "stripe",
      },
    ],
    total: 1,
  };
}
