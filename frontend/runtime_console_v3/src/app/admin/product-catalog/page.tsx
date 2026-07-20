"use client";

import { useQuery } from "@tanstack/react-query";
import { PageHeader, PageShell } from "@/components/seller-dashboard/PageShell";
import { useUserRole } from "@/hooks/useUserRole";

async function fetchStats() {
  const res = await fetch("/api/product-catalog/admin/stats");
  if (!res.ok) throw new Error("Falha ao carregar estatísticas");
  return res.json() as Promise<{
    counts: Record<string, number>;
    by_category: { category: string; total: number }[];
    by_manufacturer: { name: string; total: number }[];
    recent_syncs: {
      job_key: string;
      provider_id: string;
      status: string;
      started_at: string;
      items_upserted: number;
      errors: unknown;
    }[];
    /** Opcional — alguns backends ainda não enviam registry de providers. */
    providers?: { provider_id: string; last_status: string }[];
  }>;
}

export default function AdminProductCatalogPage() {
  const { canIngest } = useUserRole();
  const { data, isLoading, error } = useQuery({
    queryKey: ["product-catalog-admin-stats"],
    queryFn: fetchStats,
    enabled: canIngest,
  });

  if (!canIngest) {
    return (
      <PageShell>
        <PageHeader title="Catálogo Mestre" />
        <p className="text-danger">Permissão de administrador necessária.</p>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Catálogo Mestre"
        description="Produtos selados e acessórios — sincronização centralizada"
      />
      {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
      {error && <p className="text-sm text-danger">{String(error)}</p>}
      {data && (
        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-xl border border-border p-4">
            <h2 className="mb-3 font-semibold">Totais</h2>
            <ul className="space-y-1 text-sm">
              {Object.entries(data.counts).map(([k, v]) => (
                <li key={k} className="flex justify-between">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-mono">{v}</span>
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-xl border border-border p-4">
            <h2 className="mb-3 font-semibold">Por categoria</h2>
            <ul className="space-y-1 text-sm">
              {data.by_category.map((row) => (
                <li key={row.category} className="flex justify-between">
                  <span>{row.category}</span>
                  <span className="font-mono">{row.total}</span>
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-xl border border-border p-4 md:col-span-2">
            <h2 className="mb-3 font-semibold">Providers (registry)</h2>
            <ul className="space-y-1 text-sm">
              {(
                data.providers ??
                Array.from(
                  new Map(
                    data.recent_syncs.map((s) => [
                      s.provider_id,
                      { provider_id: s.provider_id, last_status: s.status },
                    ]),
                  ).values(),
                )
              ).map((p) => (
                <li key={p.provider_id} className="flex justify-between">
                  <span className="font-mono text-xs">{p.provider_id}</span>
                  <span>{p.last_status}</span>
                </li>
              ))}
            </ul>
            {data.counts?.avg_sync_duration_ms != null && (
              <p className="mt-2 text-xs text-muted-foreground">
                Tempo médio sync (30d): {data.counts.avg_sync_duration_ms} ms
              </p>
            )}
          </section>
          <section className="rounded-xl border border-border p-4 md:col-span-2">
            <h2 className="mb-3 font-semibold">Últimas sincronizações</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr>
                    <th className="p-2">Job</th>
                    <th className="p-2">Provider</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Upserts</th>
                    <th className="p-2">Início</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent_syncs.map((s, i) => (
                    <tr key={`${s.job_key}-${i}`} className="border-t border-border">
                      <td className="p-2 font-mono text-xs">{s.job_key}</td>
                      <td className="p-2">{s.provider_id}</td>
                      <td className="p-2">{s.status}</td>
                      <td className="p-2">{s.items_upserted}</td>
                      <td className="p-2 text-xs">{s.started_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </PageShell>
  );
}
