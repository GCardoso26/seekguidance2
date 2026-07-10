"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader, PageShell } from "@/components/seller-dashboard/PageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEFAULT_GAME_ORDER, type CatalogGameApi } from "@/lib/games";
import { RefreshCw } from "lucide-react";

async function fetchGames(): Promise<CatalogGameApi[]> {
  const res = await fetch("/api/games");
  if (!res.ok) throw new Error("Falha ao carregar jogos do catálogo");
  const data = await res.json();
  return (data.games ?? []) as CatalogGameApi[];
}

function formatCardCount(count: number | undefined | null): string {
  return Number(count ?? 0).toLocaleString("pt-BR");
}

function formatSyncDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("pt-BR");
}

export default function AdminCatalogPage() {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<string | null>(null);

  const {
    data: games = [],
    isError,
    error,
  } = useQuery({
    queryKey: ["catalog-games"],
    queryFn: fetchGames,
  });

  const syncMutation = useMutation({
    mutationFn: async ({ slug, full }: { slug: string; full: boolean }) => {
      await fetch("/api/auth/refresh", { method: "POST", credentials: "include" }).catch(() => null);
      const res = await fetch(`/api/games/${slug}?full=${full}`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(body || `Sync falhou (${res.status})`);
      }
      return res.json();
    },
    onSuccess: (_data, vars) => {
      setMessage(`Sync ${vars.full ? "completo" : "rápido"} iniciado para ${vars.slug}.`);
      void queryClient.invalidateQueries({ queryKey: ["catalog-games"] });
    },
    onError: (e) => {
      setMessage(e instanceof Error ? e.message : "Erro no sync");
    },
  });

  const sorted = [...games]
    .filter((game) => game.slug && DEFAULT_GAME_ORDER.includes(game.slug as (typeof DEFAULT_GAME_ORDER)[number]))
    .sort((a, b) => {
      const ai = DEFAULT_GAME_ORDER.indexOf(a.slug as (typeof DEFAULT_GAME_ORDER)[number]);
      const bi = DEFAULT_GAME_ORDER.indexOf(b.slug as (typeof DEFAULT_GAME_ORDER)[number]);
      return ai - bi;
    });

  return (
    <PageShell>
      <PageHeader
        title="Catálogo de TCGs"
        description="Sincronização manual por jogo. «Sync rápido» importa um lote pequeno; «Sync completo» pode levar vários minutos."
      />

      {isError && (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-danger">
          {(error as Error).message}
        </p>
      )}

      {message && (
        <p className="surface-card rounded-lg px-4 py-2 text-sm" role="status">
          {message}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {sorted.map((game) => {
          const lastSync = formatSyncDate(game.last_sync_at);
          return (
            <Card key={game.slug} className="border-border bg-muted/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{game.display_name ?? game.name ?? game.slug}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-muted-foreground">
                  {formatCardCount(game.card_count)} cartas
                  {game.api_source && ` · ${game.api_source}`}
                </p>
                {lastSync && <p className="text-xs text-muted-foreground">Último sync: {lastSync}</p>}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-border"
                    disabled={syncMutation.isPending}
                    onClick={() => syncMutation.mutate({ slug: game.slug, full: false })}
                  >
                    <RefreshCw className="mr-1 h-3 w-3" />
                    Sync rápido
                  </Button>
                  <Button
                    size="sm"
                    className="bg-primary text-primary-foreground"
                    disabled={syncMutation.isPending}
                    onClick={() => syncMutation.mutate({ slug: game.slug, full: true })}
                  >
                    Sync completo
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </PageShell>
  );
}
