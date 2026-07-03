"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader, PageShell } from "@/components/seller-dashboard/PageShell";
import { SellerHeader } from "@/components/seller-dashboard/SellerHeader";
import { PermissionGuard } from "@/components/PermissionGuard";
import { useFinanceRevenue } from "@/hooks/useSellerFinance";
import { formatShopPrice } from "@/lib/marketplace-shop";

const PERIODS = [
  { id: "7d", label: "7 dias" },
  { id: "30d", label: "30 dias" },
  { id: "90d", label: "90 dias" },
] as const;

function exportCsv(rows: { date: string; orders: number; gross_cents: number; fees_cents: number; net_cents: number }[]) {
  const header = "Data,Pedidos,Bruto,Taxas,Liquido\n";
  const body = rows
    .map((r) =>
      [
        r.date,
        r.orders,
        (r.gross_cents / 100).toFixed(2),
        (r.fees_cents / 100).toFixed(2),
        (r.net_cents / 100).toFixed(2),
      ].join(","),
    )
    .join("\n");
  const blob = new Blob([header + body], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "receitas.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function RevenuePage() {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");
  const { data, isLoading } = useFinanceRevenue(period);

  const chartData = useMemo(
    () =>
      [...(data?.rows ?? [])]
        .reverse()
        .map((r) => ({
          label: r.date.slice(5),
          net: r.net_cents / 100,
          gross: r.gross_cents / 100,
        })),
    [data?.rows],
  );

  return (
    <PageShell>
      <SellerHeader
        action={
          <PermissionGuard module="finance" action="export">
            <button
              type="button"
              onClick={() => exportCsv(data?.rows ?? [])}
              className="rounded border border-white/20 px-3 py-1.5 text-sm hover:bg-white/5"
            >
              Exportar CSV
            </button>
          </PermissionGuard>
        }
      />
      <main className="flex-1 space-y-4 overflow-y-auto p-6">
        <PageHeader title="Receitas" description="Receita bruta, taxas e valor líquido por dia." />
        <div className="flex flex-wrap gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              className={`rounded px-3 py-1 text-sm ${
                period === p.id ? "bg-luxury-gold/20 text-luxury-gold" : "border border-white/10 hover:bg-white/5"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <section className="rounded-xl border border-white/10 bg-white/5 p-4" data-testid="finance-revenue-chart">
          <div className="h-56">
            {isLoading ? (
              <p className="text-sm text-luxury-mist">Carregando…</p>
            ) : chartData.length === 0 ? (
              <p className="text-sm text-luxury-mist">Sem receita no período.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} width={48} />
                  <Tooltip formatter={(v: number) => formatShopPrice(Math.round(v * 100))} />
                  <Area type="monotone" dataKey="net" stroke="#d4af37" fill="#d4af37" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-luxury-mist">
                <th className="p-3">Data</th>
                <th className="p-3">Pedidos</th>
                <th className="p-3">Bruto</th>
                <th className="p-3">Taxas</th>
                <th className="p-3">Líquido</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {(data?.rows ?? []).map((row) => (
                <tr key={row.date} className="border-b border-white/5">
                  <td className="p-3">{row.date.split("-").reverse().join("/")}</td>
                  <td className="p-3">{row.orders}</td>
                  <td className="p-3">{formatShopPrice(row.gross_cents)}</td>
                  <td className="p-3">{formatShopPrice(row.fees_cents)}</td>
                  <td className="p-3">{formatShopPrice(row.net_cents)}</td>
                  <td className="p-3 capitalize">{row.status === "received" ? "Recebido" : row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </PageShell>
  );
}
