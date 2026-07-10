"use client";

import { useQuery } from "@tanstack/react-query";
import { PageHeader, PageShell } from "@/components/seller-dashboard/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ImageHealthResponse = {
  summary: {
    catalog_missing_images: number;
    listings_missing_images: number;
    events_7d: Record<string, number>;
  };
  broken_hosts: Array<{ host: string; failures: number }>;
  recent_events: Array<{
    host: string | null;
    event_type: string;
    latency_ms: number | null;
    created_at: string | null;
  }>;
  computed_at: string;
};

async function fetchImageHealth(): Promise<ImageHealthResponse> {
  const res = await fetch("/api/admin/catalog/image-health");
  if (!res.ok) throw new Error("image_health_fetch_failed");
  return res.json();
}

export default function AdminImageHealthPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-image-health"],
    queryFn: fetchImageHealth,
    staleTime: 60_000,
  });

  return (
    <PageShell>
      <PageHeader
        title="Saúde de imagens"
        description="Cartas sem imagem, falhas de carregamento e hosts problemáticos no catálogo e marketplace."
      />

      {isLoading && <p className="text-sm text-luxury-mist">Carregando métricas…</p>}
      {error && (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          Não foi possível carregar o dashboard de imagens.
        </p>
      )}

      {data && (
        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-3" aria-label="Resumo de saúde de imagens">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Catálogo sem imagem</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{data.summary.catalog_missing_images}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Listings sem imagem</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{data.summary.listings_missing_images}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Falhas (7 dias)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{data.summary.events_7d.failure ?? 0}</p>
              </CardContent>
            </Card>
          </section>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Hosts com mais falhas</CardTitle>
            </CardHeader>
            <CardContent>
              {data.broken_hosts.length === 0 ? (
                <p className="text-sm text-luxury-mist">Nenhuma falha registrada na janela.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {data.broken_hosts.map((h) => (
                    <li key={h.host} className="flex justify-between border-b border-white/5 py-2">
                      <span>{h.host}</span>
                      <span className="font-mono text-red-300">{h.failures}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Eventos recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-luxury-mist">
                      <th className="p-2">Host</th>
                      <th className="p-2">Tipo</th>
                      <th className="p-2">Latência</th>
                      <th className="p-2">Quando</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent_events.map((e, idx) => (
                      <tr key={`${e.created_at}-${idx}`} className="border-t border-white/5">
                        <td className="p-2">{e.host ?? "—"}</td>
                        <td className="p-2">{e.event_type}</td>
                        <td className="p-2">{e.latency_ms != null ? `${e.latency_ms}ms` : "—"}</td>
                        <td className="p-2">{e.created_at ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <p className="text-xs text-luxury-mist">Atualizado: {data.computed_at}</p>
        </div>
      )}
    </PageShell>
  );
}
