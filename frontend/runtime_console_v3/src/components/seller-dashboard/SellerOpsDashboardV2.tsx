"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { MarketplaceSellerIntelligencePanel } from "@/components/intelligence/IntelligencePanels";

type Overview = {
  orders_today?: number;
  revenue_today?: number;
  aov?: number;
  products_sold?: number;
  missing_images?: number;
  out_of_stock?: number;
  stagnant?: number;
  overpriced?: number;
  underpriced?: number;
  best_margin?: string;
  worst_margin?: string;
};

async function fetchSellerOverview(): Promise<Overview> {
  try {
    const res = await fetch("/api/seller/dashboard/overview", { cache: "no-store" });
    if (!res.ok) return {};
    return (await res.json()) as Overview;
  } catch {
    return {};
  }
}

/**
 * Seller Experience V2 — operational dashboard strip (Analytics + Marketplace + Pricing + Inventory).
 */
export function SellerOpsDashboardV2() {
  const enabled = isFeatureEnabled("SELLER_EXPERIENCE_V2");
  const { data = {} } = useQuery({
    queryKey: ["seller-ops-v2"],
    queryFn: fetchSellerOverview,
    enabled,
    staleTime: 60_000,
  });

  if (!enabled) return null;

  const cards = [
    { label: "Pedidos hoje", value: data.orders_today ?? "—", href: "/vendedor/painel/pedidos" },
    { label: "Receita", value: data.revenue_today != null ? `R$ ${data.revenue_today}` : "—", href: "/vendedor/painel/financeiro/receitas" },
    { label: "Ticket médio", value: data.aov != null ? `R$ ${data.aov}` : "—", href: "/vendedor/painel/estatisticas" },
    { label: "Vendidos", value: data.products_sold ?? "—", href: "/vendedor/painel/vendas" },
    { label: "Sem imagem", value: data.missing_images ?? "—", href: "/vendedor/painel/listagens" },
    { label: "Sem estoque", value: data.out_of_stock ?? "—", href: "/vendedor/painel/estoque" },
    { label: "Parados", value: data.stagnant ?? "—", href: "/vendedor/painel/insights" },
    { label: "Preço alto", value: data.overpriced ?? "—", href: "/vendedor/painel/estatisticas/inteligencia" },
    { label: "Abaixo da média", value: data.underpriced ?? "—", href: "/vendedor/painel/estatisticas/inteligencia" },
    { label: "Maior margem", value: data.best_margin ?? "—", href: "/vendedor/painel/estatisticas" },
    { label: "Menor margem", value: data.worst_margin ?? "—", href: "/vendedor/painel/estatisticas" },
    { label: "Alertas", value: "Inbox", href: "/vendedor/painel/inbox" },
  ];

  return (
    <div className="space-y-6" data-testid="seller-ops-v2">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Operação · hoje</h2>
        <p className="text-sm text-muted-foreground">
          Dashboard operacional alimentado por Analytics, Marketplace, Pricing e Inventory.
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <li key={c.label}>
            <Link
              href={c.href}
              className="block rounded-xl border border-border bg-card/50 p-3 transition hover:border-primary/40"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {c.label}
              </p>
              <p className="mt-1 truncate text-sm font-semibold">{String(c.value)}</p>
            </Link>
          </li>
        ))}
      </ul>
      <MarketplaceSellerIntelligencePanel />
      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/vendedor/painel/estatisticas/inteligencia" className="text-primary hover:underline">
          Inteligência completa →
        </Link>
        <Link href="/vendedor/painel/estatisticas" className="text-primary hover:underline">
          Performance →
        </Link>
      </div>
    </div>
  );
}
