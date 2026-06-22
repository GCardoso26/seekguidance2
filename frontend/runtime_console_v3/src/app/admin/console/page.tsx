"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserRole } from "@/hooks/useUserRole";
import { BarChart3, FileUp, Terminal } from "lucide-react";

export default function AdminConsolePage() {
  const { isAdmin, canIngest, loading } = useUserRole();

  if (loading) {
    return (
      <AppShell>
        <p className="text-muted-foreground">A verificar permissões…</p>
      </AppShell>
    );
  }

  if (!isAdmin && !canIngest) {
    return (
      <AppShell>
        <p className="text-destructive">Acesso restrito a administradores.</p>
        <Link href="/judge" className="mt-4 inline-block text-sm text-primary underline">
          Voltar à mesa
        </Link>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <h1 className="mb-2 flex items-center gap-2 text-2xl font-semibold">
        <Terminal className="h-6 w-6" aria-hidden />
        Console Admin
      </h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Ferramentas operacionais do Judge TCG (métricas, ingestão e corpus).
      </p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4" aria-hidden />
                Métricas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Qualidade do judge, latência e crescimento por jogo.
              </p>
              <Link
                href="/admin/analytics"
                className="text-sm font-medium text-primary hover:underline"
              >
                Analytics de negócio →
              </Link>
              <Link
                href="/observability?tab=judge"
                className="mt-2 block text-sm font-medium text-primary hover:underline"
              >
                Observability (latência) →
              </Link>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Catálogo de cartas (TCGs)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Sync Scryfall, Pokémon, Yu-Gi-Oh! e demais APIs para o catálogo unificado.
            </p>
            <Link href="/admin/catalog" className="text-sm font-medium text-primary hover:underline">
              Gerir catálogo →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ingestão (todos os jogos)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Estado do corpus, reindex e erros de documentos.
            </p>
            <Link href="/ingestion" className="text-sm font-medium text-primary hover:underline">
              Abrir ingestão →
            </Link>
          </CardContent>
        </Card>

        {canIngest && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileUp className="h-4 w-4" aria-hidden />
                Upload SWU
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Enviar PDF das regras de Star Wars Unlimited.
              </p>
              <Link
                href="/admin/ingestion"
                className="text-sm font-medium text-primary hover:underline"
              >
                Console de upload →
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
