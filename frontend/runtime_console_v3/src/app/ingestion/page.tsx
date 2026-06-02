"use client";

import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricPanel } from "@/components/operational/metric-panel";
import {
  getIngestionErrors,
  getIngestionJobs,
  getIngestionStatus,
  reindexGame,
} from "@/services/infrastructureApi";
import { useAuthStore } from "@/stores/auth-store";
import { useState } from "react";

export default function IngestionAdminPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [reindexing, setReindexing] = useState<string | null>(null);

  const status = useQuery({
    queryKey: ["ingestion-status"],
    queryFn: getIngestionStatus,
    enabled: isAuthenticated,
  });
  const jobs = useQuery({
    queryKey: ["ingestion-jobs"],
    queryFn: getIngestionJobs,
    enabled: isAuthenticated,
  });
  const errors = useQuery({
    queryKey: ["ingestion-errors"],
    queryFn: () => getIngestionErrors(),
    enabled: isAuthenticated,
  });

  async function handleReindex(slug: string) {
    setReindexing(slug);
    try {
      await reindexGame(slug);
      await status.refetch();
      await jobs.refetch();
    } finally {
      setReindexing(null);
    }
  }

  return (
    <AppShell>
      <h1 className="mb-4 text-2xl font-semibold">Ingestion Admin</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Jogos e corpus</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4">Jogo</th>
                  <th className="py-2 pr-4">Chunks</th>
                  <th className="py-2 pr-4">Rule atoms</th>
                  <th className="py-2 pr-4">Cobertura</th>
                  <th className="py-2 pr-4">RAG</th>
                  <th className="py-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {(status.data?.games ?? []).map((g) => (
                  <tr key={g.game_slug} className="border-b border-border/50">
                    <td className="py-2 font-medium">{g.display_name}</td>
                    <td className="py-2">{g.chunk_count}</td>
                    <td className="py-2">{g.rule_atoms}</td>
                    <td className="py-2">{g.coverage_pct}%</td>
                    <td className="py-2">{g.rag_ready ? "Sim" : "Não"}</td>
                    <td className="py-2">
                      <button
                        type="button"
                        disabled={reindexing === g.game_slug}
                        onClick={() => void handleReindex(g.game_slug)}
                        className="rounded-md border px-2 py-1 text-xs font-semibold hover:bg-muted"
                      >
                        {reindexing === g.game_slug ? "A enfileirar…" : "Re-indexar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Jobs recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="max-h-64 overflow-auto text-xs">
              {JSON.stringify(jobs.data?.jobs ?? [], null, 2)}
            </pre>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Diagnóstico de erros</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="max-h-64 overflow-auto text-xs">
              {JSON.stringify(errors.data?.errors ?? [], null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
