import type { SellerDailyBrief, SellerInsightsResponse } from "@/types/seller-ai";

export function sellerAiBriefMock(): SellerDailyBrief {
  return {
    greeting: "Bom dia",
    summary:
      "Bom dia.\n\nHoje encontrei 8 oportunidades.\n- 3 produtos com estoque baixo\n- 5 anúncios sem imagem\n- 2 pedidos atrasados\n- 1 ticket aguardando resposta\nRecebimentos previstos: R$ 1.250,00",
    opportunity_count: 8,
    highlights: [
      "3 produtos com estoque baixo",
      "5 anúncios sem imagem",
      "2 pedidos atrasados",
      "Recebimentos previstos: R$ 1.250,00",
    ],
    metrics: {
      revenue_today_cents: 382000,
      pending_orders: 5,
      open_tickets: 1,
      trust_score: 78,
      chargebacks_open: 0,
    },
    top_insights: [
      {
        id: "inv-low-stock",
        category: "inventory",
        priority: "high",
        title: "3 produtos com estoque baixo",
        description: "Itens com quantidade abaixo do limite operacional.",
        reason: "Estoque abaixo de 3 unidades.",
        impact: "Reduz risco de oversell.",
        cta_label: "Ver estoque",
        cta_href: "/vendedor/painel/estoque",
        metric_value: 3,
      },
      {
        id: "ord-late",
        category: "orders",
        priority: "high",
        title: "2 pedidos atrasados",
        description: "Pedidos fora do SLA.",
        reason: "SLA de fulfillment.",
        impact: "Priorizar envio.",
        cta_label: "Ver pedidos",
        cta_href: "/vendedor/painel/pedidos?tab=late",
        metric_value: 2,
      },
      {
        id: "tix-open",
        category: "tickets",
        priority: "high",
        title: "1 ticket aguardando resposta",
        description: "Atendimento pendente.",
        reason: "Ticket aberto.",
        impact: "Melhora satisfação.",
        cta_label: "Responder",
        cta_href: "/vendedor/painel/atendimento/tickets",
        metric_value: 1,
      },
    ],
    generated_at: new Date().toISOString(),
  };
}

export function sellerAiInsightsMock(): SellerInsightsResponse {
  const brief = sellerAiBriefMock();
  const insights = [
    ...brief.top_insights,
    {
      id: "inv-missing-image",
      category: "inventory" as const,
      priority: "medium" as const,
      title: "5 anúncios sem imagem",
      description: "Anúncios sem imagem convertem menos.",
      reason: "Listings sem card_image_url.",
      impact: "Melhora CTR.",
      cta_label: "Revisar anúncios",
      cta_href: "/vendedor/painel/listagens?filter=no_image",
      metric_value: 5,
    },
    {
      id: "price-above",
      category: "pricing" as const,
      priority: "medium" as const,
      title: "4 preços acima da média",
      description: "Competitividade reduzida.",
      reason: "Pricing intelligence.",
      impact: "Ajuste pode aumentar conversão.",
      cta_label: "Ver sugestões",
      cta_href: "/vendedor/painel/insights?tab=pricing",
      metric_value: 4,
      prepared_action_type: "bulk_price_update",
    },
  ];
  return {
    insights,
    grouped: {
      high: insights.filter((i) => i.priority === "high"),
      medium: insights.filter((i) => i.priority === "medium"),
      low: insights.filter((i) => i.priority === "low"),
    },
    total: insights.length,
    store_id: "mock-store",
  };
}
