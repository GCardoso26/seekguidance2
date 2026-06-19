"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { BusinessAnalytics } from "@/hooks/useBusinessAnalytics";

const PIE_COLORS = ["#d4af37", "#c9a227", "#b8941f", "#9a7b1a", "#7c6215", "#5e4a10", "#40320b", "#221a06"];

type Props = {
  data: BusinessAnalytics;
};

export function AdminAnalyticsCharts({ data }: Props) {
  const tcgData = data.topTcgs.map((t) => ({
    name: String(t.tcg || "outros").toUpperCase(),
    value: t.count,
  }));

  const hourData = Array.from({ length: 24 }, (_, hour) => {
    const row = data.peakHours.find((p) => p.hour === hour);
    return { hour: `${hour}h`, count: row?.count ?? 0 };
  });

  const funnelData = [
    { step: "Checkout iniciado", count: data.funnel.checkoutStarted },
    { step: "Checkout concluído", count: data.funnel.checkoutCompleted },
  ];

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-2">
      <section className="rounded-xl border border-slate-700 p-4">
        <h2 className="font-semibold">TCGs mais consultados</h2>
        <div className="mt-4 h-64">
          {tcgData.length === 0 ? (
            <p className="text-sm text-slate-400">Sem consultas no período.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={tcgData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {tcgData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-700 p-4">
        <h2 className="font-semibold">Horários de pico (BRT)</h2>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="hour" tick={{ fill: "#94a3b8", fontSize: 10 }} interval={2} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#d4af37" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-xl border border-slate-700 p-4 lg:col-span-2">
        <h2 className="font-semibold">Funil Free → Pro (checkout)</h2>
        <div className="mt-4 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnelData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis type="number" tick={{ fill: "#94a3b8" }} />
              <YAxis type="category" dataKey="step" width={140} tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#22c55e" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-sm text-slate-400">
          Conversão do funil: {data.funnel.conversionPercent}%
        </p>
      </section>
    </div>
  );
}
