export type GlobalSearchItem = {
  type: "order" | "customer" | "listing" | "product" | "coupon";
  id: string;
  title: string;
  subtitle?: string | null;
  status?: string;
  created_at?: string | null;
};

export type GlobalSearchResponse = {
  query: string;
  categories: {
    orders?: GlobalSearchItem[];
    customers?: GlobalSearchItem[];
    listings?: GlobalSearchItem[];
    products?: GlobalSearchItem[];
    coupons?: GlobalSearchItem[];
  };
  total: number;
};

export function sellerGlobalSearchMock(q: string): GlobalSearchResponse {
  const query = q.trim();
  if (query.length < 2) {
    return { query, categories: {}, total: 0 };
  }

  const categories = {
    orders: [
      {
        type: "order" as const,
        id: "order-18555",
        title: "#18555",
        subtitle: "João Silva",
        status: "shipped",
        created_at: new Date().toISOString(),
      },
      {
        type: "order" as const,
        id: "order-18553",
        title: "#18553",
        subtitle: "Carlos Lima",
        status: "pending",
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ],
    customers: [
      {
        type: "customer" as const,
        id: "cust-joao",
        title: "João Silva",
        subtitle: "joao@email.com",
        created_at: new Date().toISOString(),
      },
      {
        type: "customer" as const,
        id: "cust-maria",
        title: "Maria Souza",
        subtitle: "maria@email.com",
        created_at: new Date().toISOString(),
      },
    ],
    listings: [
      {
        type: "listing" as const,
        id: "listing-1",
        title: "Lightning Bolt",
        subtitle: "Dominaria United",
        created_at: new Date().toISOString(),
      },
      {
        type: "listing" as const,
        id: "listing-2",
        title: "Sol Ring",
        subtitle: "Commander Masters",
        created_at: new Date().toISOString(),
      },
    ],
    products: [
      {
        type: "product" as const,
        id: "prod-1",
        title: "Sleeve Ultra Pro — Standard",
        subtitle: "sleeve",
        created_at: new Date().toISOString(),
      },
    ],
    coupons: [
      {
        type: "coupon" as const,
        id: "cup-1",
        title: "CUPOM10",
        subtitle: "percentage",
        created_at: new Date().toISOString(),
      },
    ],
  };

  const filter = (items: GlobalSearchItem[]) =>
    items.filter(
      (i) =>
        i.title.toLowerCase().includes(query.toLowerCase()) ||
        (i.subtitle ?? "").toLowerCase().includes(query.toLowerCase()) ||
        query === "185",
    );

  const filtered = {
    orders: filter(categories.orders),
    customers: filter(categories.customers),
    listings: filter(categories.listings),
    products: filter(categories.products),
    coupons: filter(categories.coupons),
  };

  const total = Object.values(filtered).reduce((s, arr) => s + arr.length, 0);
  return { query, categories: filtered, total: total || categories.orders.length };
}

export type HeaderNotificationCategory = {
  type: string;
  label: string;
  count: number;
  action: string;
  urgent?: boolean;
};

export type HeaderNotificationsResponse = {
  total_unread: number;
  categories: HeaderNotificationCategory[];
};

export function sellerHeaderNotificationsMock(): HeaderNotificationsResponse {
  return {
    total_unread: 12,
    categories: [
      { type: "new_orders", label: "12 novos pedidos", count: 12, action: "/vendedor/painel/pedidos" },
      { type: "tickets", label: "3 tickets", count: 3, action: "/vendedor/painel/atendimento/tickets" },
      { type: "payments", label: "2 pagamentos", count: 2, action: "/vendedor/painel/financeiro/receitas" },
      {
        type: "chargeback",
        label: "1 chargeback",
        count: 1,
        action: "/vendedor/painel/financeiro/stripe",
        urgent: true,
      },
    ],
  };
}
