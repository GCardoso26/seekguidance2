"use client";

import Link from "next/link";
import { GalleryFade } from "@/components/gallery/GalleryMotion";
import { PageHeader, PageShell } from "@/components/seller-dashboard/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserRole } from "@/hooks/useUserRole";
import { BarChart3, FileUp } from "lucide-react";

export default function AdminConsolePage() {
  const { isAdmin, canIngest } = useUserRole();

  return (
    <PageShell>
      <PageHeader
        title="Console Admin"
        description="Ferramentas operacionais do Judge TCG (métricas, ingestão e corpus)."
      />

      <GalleryFade className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isAdmin && (
          <Card className="border-border bg-muted/50">
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
              <Link href="/admin/analytics" className="text-sm font-medium text-primary hover:underline">
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

        <Card className="border-border bg-muted/50">
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

        <Card className="border-border bg-muted/50">
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
          <Card className="border-border bg-muted/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileUp className="h-4 w-4" aria-hidden />
                Ingestão de regras
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Status de upload de regras. SWU está em hard-exit (ADR-016).
              </p>
              <Link href="/admin/ingestion" className="text-sm font-medium text-primary hover:underline">
                Ver status →
              </Link>
            </CardContent>
          </Card>
        )}
      </GalleryFade>
    </PageShell>
  );
}
