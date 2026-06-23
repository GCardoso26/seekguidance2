"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserRole } from "@/hooks/useUserRole";
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
  const { isAdmin, loading } = useUserRole();
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
      const text = await res.text();
      let payload: { detail?: string; error?: string } = {};
      try {
        payload = text ? (JSON.parse(text) as typeof payload) : {};
      } catch {
        payload = { detail: text };
      }
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Sessão expirada. Faça login novamente.");
        }
        throw new Error(payload.detail || payload.error || `Sync falhou (${res.status})`);
      }
      return JSON.parse(text || "{}");
    },
    onSuccess: (data, vars) => {
      setMessage(`Sync ${vars.slug}: ${data.synced ?? 0} cartas`);
      queryClient.invalidateQueries({ queryKey: ["catalog-games"] });
      queryClient.invalidateQueries({ queryKey: ["catalog-health"] });
    },
    onError: (err: Error) => setMessage(err.message),
  });

  if (loading) {
    return (
      <AppShell>
        <p className="text-muted-foreground">A verificar permissões…</p>
      </AppShell>
    );
  }

  if (!isAdmin) {
    return (
      <AppShell>
        <p className="text-destructive">Acesso restrito.</p>
        <Link href="/admin/console" className="mt-4 inline-block text-sm text-primary underline">
          Voltar
        </Link>
      </AppShell>
    );
  }

  const sorted = [...games]
    .filter((game) => game.slug && DEFAULT_GAME_ORDER.includes(game.slug as (typeof DEFAULT_GAME_ORDER)[number]))
    .sort((a, b) => {
      const ai = DEFAULT_GAME_ORDER.indexOf(a.slug as (typeof DEFAULT_GAME_ORDER)[number]);
      const bi = DEFAULT_GAME_ORDER.indexOf(b.slug as (typeof DEFAULT_GAME_ORDER)[number]);
      return ai - bi;
    });

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Catálogo de TCGs</h1>
          <p className="text-sm text-muted-foreground">Sincronização manual por jogo (Scryfall, YGOPRODeck, etc.)</p>
        </div>
        <Link href="/admin/console" className="text-sm text-primary hover:underline">
          ← Console
        </Link>
      </div>

      {isError && (
        <p className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {(error as Error).message}
        </p>
      )}

      {message && (
        <p className="mb-4 rounded-lg border bg-muted/50 px-4 py-2 text-sm" role="status">
          {message}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {sorted.map((game) => {
          const lastSync = formatSyncDate(game.last_sync_at);
          return (
            <Card key={game.slug}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{game.display_name ?? game.name ?? game.slug}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-muted-foreground">
                  {formatCardCount(game.card_count)} cartas
                  {game.api_source && ` · ${game.api_source}`}
                </p>
                {lastSync && (
                  <p className="text-xs text-muted-foreground">Último sync: {lastSync}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={syncMutation.isPending}
                    onClick={() => syncMutation.mutate({ slug: game.slug, full: false })}
                  >
                    <RefreshCw className="mr-1 h-3 w-3" />
                    Sync rápido
                  </Button>
                  <Button
                    size="sm"
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
    </AppShell>
  );
}
