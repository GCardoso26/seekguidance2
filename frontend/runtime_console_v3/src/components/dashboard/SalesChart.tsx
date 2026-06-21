"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatShopPrice } from "@/lib/marketplace-shop";

type Point = { day: string; revenue_cents: number };

export function SalesChart({ data }: { data: Point[] }) {
  const chartData = data.map((d) => ({
    day: String(d.day).slice(5),
    revenue: Number(d.revenue_cents) / 100,
  }));

  if (chartData.length === 0) {
    return <p className="text-sm text-luxury-mist">Sem vendas nos últimos 30 dias.</p>;
  }

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <XAxis dataKey="day" tick={{ fill: "#9ca3af", fontSize: 10 }} />
          <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} width={40} />
          <Tooltip formatter={(v: number) => formatShopPrice(Math.round(v * 100))} />
          <Bar dataKey="revenue" fill="#c9a227" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
