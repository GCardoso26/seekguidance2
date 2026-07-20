"use client";

import { useQuery } from "@tanstack/react-query";
import { PageHeader, PageShell } from "@/components/seller-dashboard/PageShell";
import { useUserRole } from "@/hooks/useUserRole";

export default function ImportMonitorPage() {
  const { canIngest } = useUserRole();
  const { data, isLoading, error } = useQuery({
    queryKey: ["import-monitor"],
    queryFn: async () => {
      const res = await fetch("/api/product-catalog/import-monitor");
      if (!res.ok) throw new Error("Falha ao carregar monitor");
      return res.json();
    },
    enabled: canIngest,
    refetchInterval: 30_000,
  });

  if (!canIngest) {
    return (
      <PageShell>
        <PageHeader title="Import Monitor" />
        <p className="text-danger">Permissão de administrador necessária.</p>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Import Monitor"
        description="Providers, schedules, novos/atualizados, falhas e rate limit"
      />
      {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
      {error && <p className="text-sm text-danger">{String(error)}</p>}
      {data && (
        <div className="space-y-6">
          <section className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-muted-foreground">
                <tr>
                  <th className="p-2">Provider</th>
                  <th className="p-2">Schedule</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Próximo</th>
                  <th className="p-2">Último</th>
                  <th className="p-2">Rate limit</th>
                </tr>
              </thead>
              <tbody>
                {(data.providers ?? []).map(
                  (p: {
                    provider_id: string;
                    schedule_kind: string;
                    last_status: string;
                    next_run_at: string;
                    last_sync_at: string;
                    rate_limit_rpm: number | null;
                  }) => (
                    <tr key={p.provider_id} className="border-t border-border">
                      <td className="p-2 font-mono text-xs">{p.provider_id}</td>
                      <td className="p-2">{p.schedule_kind}</td>
                      <td className="p-2">{p.last_status}</td>
                      <td className="p-2 text-xs">{p.next_run_at ?? "—"}</td>
                      <td className="p-2 text-xs">{p.last_sync_at ?? "—"}</td>
                      <td className="p-2">{p.rate_limit_rpm ?? "—"}</td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </section>

          <section className="overflow-x-auto rounded-xl border border-border">
            <h2 className="border-b border-border p-3 font-semibold">Execuções recentes</h2>
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="p-2">Provider</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Novos</th>
                  <th className="p-2">Atualizados</th>
                  <th className="p-2">Falhas</th>
                  <th className="p-2">ms</th>
                </tr>
              </thead>
              <tbody>
                {(data.import_runs?.length ? data.import_runs : data.sync_runs_fallback ?? []).map(
                  (
                    r: {
                      provider_id: string;
                      status: string;
                      items_new?: number;
                      items_updated?: number;
                      items_failed?: number;
                      duration_ms?: number;
                      started_at: string;
                    },
                    i: number,
                  ) => (
                    <tr key={`${r.provider_id}-${i}`} className="border-t border-border">
                      <td className="p-2 font-mono text-xs">{r.provider_id}</td>
                      <td className="p-2">{r.status}</td>
                      <td className="p-2">{r.items_new ?? "—"}</td>
                      <td className="p-2">{r.items_updated ?? "—"}</td>
                      <td className="p-2">{r.items_failed ?? "—"}</td>
                      <td className="p-2">{r.duration_ms ?? "—"}</td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </section>
        </div>
      )}
    </PageShell>
  );
}
