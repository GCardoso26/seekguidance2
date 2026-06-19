"use client";

import Link from "next/link";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAdminStats } from "@/hooks/useAdmin";

const qc = new QueryClient();

function AdminDashboard() {
  const { data, isLoading, isError } = useAdminStats();
  const d = data as Record<string, unknown> | undefined;

  return (
    <div className="min-h-screen bg-slate-900 p-6 text-slate-100">
      <Link href="/" className="text-sm text-slate-400">
        ← Início
      </Link>
      <h1 className="mt-2 text-2xl font-bold">Administração Judge TCG</h1>

      {isLoading && <p className="mt-4 text-slate-400">Carregando…</p>}
      {isError && <p className="mt-4 text-red-400">Acesso restrito a administradores.</p>}

      {d && (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Usuários" value={String(d.totalUsers)} />
            <StatCard title="Torneios (30d)" value={String(d.tournaments30d)} />
            <StatCard
              title="Receita (30d)"
              value={new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                Number(d.revenueCents30d ?? 0) / 100,
              )}
            />
            <StatCard title="Disputas" value={String(d.disputes30d)} />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <section className="rounded-xl border border-slate-700 p-4">
              <h2 className="font-semibold">Analytics de negócio</h2>
              <p className="mt-2 text-sm text-slate-400">Conversão, churn, LTV e TCGs mais consultados.</p>
              <Link href="/admin/analytics" className="mt-3 inline-block text-sm text-amber-400 hover:underline">
                Abrir dashboard →
              </Link>
            </section>
            <section className="rounded-xl border border-slate-700 p-4">
              <h2 className="font-semibold">Torneios ativos</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {((d.activeTournaments as Array<Record<string, unknown>>) ?? []).map((t) => (
                  <li key={String(t.id)}>
                    {String(t.name)} — {String(t.status)}
                  </li>
                ))}
              </ul>
            </section>
            <section className="rounded-xl border border-slate-700 p-4">
              <h2 className="font-semibold">Usuários recentes</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {((d.recentUsers as Array<Record<string, unknown>>) ?? []).map((u) => (
                  <li key={String(u.id)}>@{String(u.handle)}</li>
                ))}
              </ul>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-700 p-4">
      <div className="text-2xl font-bold text-amber-400">{value}</div>
      <div className="text-sm text-slate-400">{title}</div>
    </div>
  );
}

export default function Page() {
  return (
    <QueryClientProvider client={qc}>
      <AdminDashboard />
    </QueryClientProvider>
  );
}
