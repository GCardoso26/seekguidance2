"use client";

import Link from "next/link";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PageHeader, PageShell } from "@/components/seller-dashboard/PageShell";
import { useAdminStats } from "@/hooks/useAdmin";

const qc = new QueryClient();

function AdminDashboard() {
  const { data, isLoading, isError } = useAdminStats();
  const d = data as Record<string, unknown> | undefined;

  return (
    <PageShell>
      <PageHeader
        title="Administração Judge TCG"
        description="Visão geral da plataforma e atalhos operacionais."
      />

      {isLoading && <p className="text-luxury-mist">Carregando…</p>}
      {isError && <p className="text-red-400">Não foi possível carregar estatísticas.</p>}

      {d && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-xl border border-white/10 p-4">
              <h2 className="font-semibold">Retenção e funil</h2>
              <p className="mt-2 text-sm text-luxury-mist">WAU/MAU, conversão e Liga Pass.</p>
              <Link href="/admin/retention" className="mt-3 inline-block text-sm text-luxury-gold hover:underline">
                Abrir retenção →
              </Link>
            </section>
            <section className="rounded-xl border border-white/10 p-4">
              <h2 className="font-semibold">Dashboard marketplace</h2>
              <p className="mt-2 text-sm text-luxury-mist">GMV, conversão, top cartas e eventos.</p>
              <Link href="/admin/dashboard" className="mt-3 inline-block text-sm text-luxury-gold hover:underline">
                Abrir dashboard →
              </Link>
            </section>
            <section className="rounded-xl border border-white/10 p-4">
              <h2 className="font-semibold">Analytics de negócio</h2>
              <p className="mt-2 text-sm text-luxury-mist">Conversão, churn, LTV e TCGs mais consultados.</p>
              <Link href="/admin/analytics" className="mt-3 inline-block text-sm text-luxury-gold hover:underline">
                Abrir analytics →
              </Link>
            </section>
            <section className="rounded-xl border border-white/10 p-4">
              <h2 className="font-semibold">Torneios ativos</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {((d.activeTournaments as Array<Record<string, unknown>>) ?? []).map((t) => (
                  <li key={String(t.id)}>
                    {String(t.name)} — {String(t.status)}
                  </li>
                ))}
              </ul>
            </section>
            <section className="rounded-xl border border-white/10 p-4">
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
    </PageShell>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 p-4">
      <div className="text-2xl font-bold text-luxury-gold">{value}</div>
      <div className="text-sm text-luxury-mist">{title}</div>
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
