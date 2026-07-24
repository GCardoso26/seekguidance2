"use client";

import Link from "next/link";
import { PageHeader, PageShell } from "@/components/seller-dashboard/PageShell";
import { useUserRole } from "@/hooks/useUserRole";

/**
 * ADR-016: Star Wars Unlimited (SWU) hard-exit do ecossistema de produto.
 * A rota permanece para não quebrar bookmarks, mas a ingestão está desativada.
 */
export default function AdminIngestionUploadPage() {
  const { canIngest } = useUserRole();

  return (
    <PageShell>
      <PageHeader
        title="Ingestão de regras"
        description="Upload de PDF por jogo — SWU removido do ecossistema (ADR-016)."
      />
      <div className="rounded-xl border border-border p-6 space-y-3">
        <p className="text-sm text-muted-foreground">
          Star Wars: Unlimited, Cardfight!! Vanguard e Union Arena estão em hard-exit até segunda
          ordem (ADR-016). A ingestão SWU não está mais disponível.
        </p>
        {!canIngest ? (
          <p className="text-danger text-sm">Permissão de ingestão necessária para outras operações.</p>
        ) : null}
        <Link href="/admin/catalog" className="text-sm text-primary underline-offset-2 hover:underline">
          Ir para Catálogo TCGs
        </Link>
      </div>
    </PageShell>
  );
}
