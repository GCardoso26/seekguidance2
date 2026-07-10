import { formatShopPrice } from "@/lib/marketplace-shop";
import type { SellerStats } from "@/types/seller";

interface Props {
  stats: SellerStats;
}

export function SellerStatsPanel({ stats }: Props) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Período: {stats.period === "all" ? "Todo o histórico" : `Últimos ${stats.period}`}
      </p>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Vendas" value={String(stats.sales_count)} />
        <StatCard label="Faturamento" value={formatShopPrice(stats.revenue_cents)} />
        <StatCard label="Compradores únicos" value={String(stats.unique_buyers)} />
        <StatCard
          label="Ticket médio"
          value={formatShopPrice(stats.average_order_value_cents)}
        />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-card p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-bold">{value}</p>
    </div>
  );
}
