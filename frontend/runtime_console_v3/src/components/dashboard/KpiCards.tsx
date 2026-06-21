import { formatShopPrice } from "@/lib/marketplace-shop";

type Props = {
  revenue?: { today_cents?: number; week_cents?: number; month_cents?: number };
  stats?: {
    paid_orders?: number;
    pending_orders?: number;
    active_products?: number;
    product_count?: number;
  };
  averageRating?: number;
  plan?: string;
};

export function KpiCards({ revenue, stats, averageRating, plan }: Props) {
  const cards = [
    { label: "Hoje", value: formatShopPrice(Number(revenue?.today_cents ?? 0)) },
    { label: "7 dias", value: formatShopPrice(Number(revenue?.week_cents ?? 0)) },
    { label: "30 dias", value: formatShopPrice(Number(revenue?.month_cents ?? 0)) },
    {
      label: "Pendentes",
      value: String(stats?.pending_orders ?? 0),
      alert: Number(stats?.pending_orders ?? 0) > 0,
    },
    { label: "Avaliação", value: averageRating ? `${averageRating.toFixed(1)} ★` : "—" },
    {
      label: "Produtos",
      value: `${stats?.active_products ?? 0}${plan === "free" ? " / 20" : ""}`,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className={`rounded-xl border bg-white/5 p-4 ${c.alert ? "border-red-500/40" : "border-white/10"}`}
        >
          <p className="text-xs uppercase tracking-wide text-luxury-mist">{c.label}</p>
          <p className="mt-1 text-xl font-bold">{c.value}</p>
        </div>
      ))}
    </div>
  );
}
