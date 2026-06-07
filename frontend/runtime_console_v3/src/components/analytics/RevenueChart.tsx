type Props = {
  totalRevenueCents: number;
  periodDays: number;
};

export function RevenueChart({ totalRevenueCents, periodDays }: Props) {
  const formatted = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    totalRevenueCents / 100,
  );

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-6">
      <div className="text-3xl font-bold text-amber-400">{formatted}</div>
      <div className="text-sm text-slate-400">Receita ({periodDays} dias)</div>
    </div>
  );
}
