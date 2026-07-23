/**
 * Intelligence Platform — explains what is happening (Epic 11).
 * Composition over Collection / Pricing / Marketplace / Analytics BFFs. No new BC.
 */

export type InsightTone = "up" | "down" | "neutral" | "action";

export type IntelligenceInsight = {
  id: string;
  title: string;
  detail: string;
  tone: InsightTone;
  href?: string;
  ctaLabel?: string;
  metric?: string;
};

async function softJson<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

export async function buildCollectionIntelligence(): Promise<IntelligenceInsight[]> {
  const insights = await softJson<{
    completionPct?: number;
    totalValue?: number;
    valueChange30d?: number;
    valueChangeToday?: number;
    risingCount?: number;
    highDemandCount?: number;
    missingCount?: number;
  }>("/api/user/collection/insights", {});

  const items: IntelligenceInsight[] = [];
  const delta = insights.valueChange30d ?? insights.valueChangeToday;
  if (delta != null) {
    items.push({
      id: "col-value",
      title: delta >= 0 ? "Sua coleção valorizou" : "Sua coleção desvalorizou",
      detail: "Movimento estimado via Pricing + Collection insights.",
      tone: delta >= 0 ? "up" : "down",
      metric: `R$ ${Math.abs(delta).toFixed(0)}`,
      href: "/colecao",
      ctaLabel: "Ver dashboard",
    });
  }
  if (insights.risingCount != null && insights.risingCount > 0) {
    items.push({
      id: "col-rising",
      title: `${insights.risingCount} cartas subiram mais de 15%`,
      detail: "Oportunidade de acompanhar liquidez no marketplace.",
      tone: "up",
      href: "/loja/tendencias",
      ctaLabel: "Ver movers",
    });
  }
  if (insights.highDemandCount != null && insights.highDemandCount > 0) {
    items.push({
      id: "col-demand",
      title: `Você possui ${insights.highDemandCount} cartas com alta procura`,
      detail: "Vale a pena anunciar agora no Marketplace.",
      tone: "action",
      href: "/vendedor/painel/listagens/nova",
      ctaLabel: "Anunciar",
    });
  }
  if (insights.completionPct != null) {
    items.push({
      id: "col-progress",
      title: `Progresso ${Math.round(insights.completionPct)}%`,
      detail:
        insights.missingCount != null && insights.missingCount > 0
          ? `Faltam ${insights.missingCount} cartas.`
          : "Coleção alinhada ao catálogo.",
      tone: "neutral",
      href: "/colecao/faltantes",
      ctaLabel: "Completar",
    });
  }
  if (!items.length) {
    items.push({
      id: "col-empty",
      title: "Comece a construir inteligência da coleção",
      detail: "Adicione cartas para gerar insights de valor e demanda.",
      tone: "neutral",
      href: "/colecao",
      ctaLabel: "Abrir coleção",
    });
  }
  return items;
}

export async function buildDeckIntelligence(deckId: string): Promise<IntelligenceInsight[]> {
  const shop = await softJson<{
    owned_pct?: number;
    missing_count?: number;
    min_cost?: number;
    avg_cost?: number;
    savings?: number;
    expensive?: Array<{ name?: string }>;
    cheap?: Array<{ name?: string }>;
  }>(`/api/buyer/decks/${encodeURIComponent(deckId)}/shop?mode=missing`, {});

  const items: IntelligenceInsight[] = [];
  if (shop.owned_pct != null) {
    items.push({
      id: "deck-owned",
      title: `${Math.round(shop.owned_pct)}% do deck completo`,
      detail:
        shop.missing_count != null && shop.missing_count > 0
          ? `Faltam ${shop.missing_count} cartas.`
          : "Lista alinhada à sua coleção.",
      tone: "neutral",
      metric: `${Math.round(shop.owned_pct)}%`,
      href: `/decks/${deckId}?tab=marketplace`,
      ctaLabel: "Comprar tudo",
    });
  }
  if (shop.min_cost != null) {
    items.push({
      id: "deck-min",
      title: "Custo mínimo",
      detail: "Melhor combinação de vendedores (Marketplace + Pricing).",
      tone: "action",
      metric: `R$ ${shop.min_cost.toFixed(0)}`,
      href: `/decks/${deckId}?tab=marketplace`,
      ctaLabel: "Ver ofertas",
    });
  }
  if (shop.avg_cost != null) {
    items.push({
      id: "deck-avg",
      title: "Custo médio",
      detail: "Referência de mercado para completar o deck.",
      tone: "neutral",
      metric: `R$ ${shop.avg_cost.toFixed(0)}`,
    });
  }
  if (shop.savings != null && shop.savings > 0) {
    items.push({
      id: "deck-save",
      title: "Economia possível",
      detail: "Comparando combinação ótima vs preço médio.",
      tone: "up",
      metric: `R$ ${shop.savings.toFixed(0)}`,
    });
  }
  if (!items.length) {
    items.push({
      id: "deck-shop",
      title: "Abrir shopping do deck",
      detail: "Cartas faltantes, caras/baratas e frete estimado via APIs públicas.",
      tone: "action",
      href: `/decks/${deckId}?tab=marketplace`,
      ctaLabel: "Comprar tudo",
    });
  }
  return items;
}

export async function buildMarketplaceSellerIntelligence(): Promise<IntelligenceInsight[]> {
  const data = await softJson<{
    ideal_price_hint?: string;
    liquidity?: string;
    competition?: string;
    sell_velocity?: string;
    listed_count?: number;
    suggested_price?: number;
    margin_estimate?: number;
    recent_sales?: number;
  }>("/api/seller/intelligence", {});

  return [
    {
      id: "mkt-ideal",
      title: "Preço ideal",
      detail: data.ideal_price_hint || "Sugestão automática baseada em Analytics + Pricing.",
      tone: "action",
      metric: data.suggested_price != null ? `R$ ${data.suggested_price.toFixed(0)}` : undefined,
      href: "/vendedor/painel/estatisticas/inteligencia",
      ctaLabel: "Abrir inteligência",
    },
    {
      id: "mkt-liq",
      title: "Liquidez",
      detail: data.liquidity || "Velocidade e demanda do inventário.",
      tone: "neutral",
      href: "/vendedor/painel/estatisticas",
    },
    {
      id: "mkt-comp",
      title: "Competição",
      detail: data.competition || "Quantidade anunciada e pressão de preço.",
      tone: "neutral",
    },
    {
      id: "mkt-vel",
      title: "Velocidade de venda",
      detail: data.sell_velocity || "Últimas vendas e ritmo estimado.",
      tone: "neutral",
      metric: data.recent_sales != null ? String(data.recent_sales) : undefined,
    },
    {
      id: "mkt-margin",
      title: "Margem estimada",
      detail: "Com base em preço sugerido vs custo quando disponível.",
      tone: "up",
      metric: data.margin_estimate != null ? `${data.margin_estimate.toFixed(0)}%` : undefined,
    },
  ];
}
