import { formatShopPrice } from "@/lib/marketplace-shop";
import { StatCard } from "./StatCard";

type Props = {
  kpis?: {
    revenue?: { current?: number; previous?: number };
    sales_count?: number;
    active_listings?: number;
  };
  revenue?: { month_cents?: number; week_cents?: number; today_cents?: number };
};

export function DashboardStats({ kpis, revenue }: Props) {
  const current = kpis?.revenue?.current ?? revenue?.month_cents ?? 0;
  const sales = kpis?.sales_count ?? 0;
  const listings = kpis?.active_listings ?? 0;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard label="Receita (30 dias)" value={formatShopPrice(current)} />
      <StatCard label="Vendas pagas" value={String(sales)} />
      <StatCard label="Listagens ativas" value={String(listings)} />
    </div>
  );
}
