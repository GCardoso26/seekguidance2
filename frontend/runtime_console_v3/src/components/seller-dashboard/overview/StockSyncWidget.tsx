"use client";

import Link from "next/link";

type Props = {
  lastSyncAt?: string | null;
  activeListings?: number;
  lowStockCount?: number;
  importHref?: string;
};

export function StockSyncWidget({
  lastSyncAt,
  activeListings = 0,
  lowStockCount = 0,
  importHref = "/vendedor/painel/estoque",
}: Props) {
  const syncLabel = lastSyncAt
    ? new Date(lastSyncAt).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Nunca";

  return (
    <section className="rounded-xl border border-border bg-card/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Sync de estoque</h3>
          <p className="mt-1 text-xs text-muted-foreground">Último import/sync: {syncLabel}</p>
        </div>
        <Link href={importHref} className="text-xs text-primary underline">
          Importar CSV
        </Link>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">Listagens ativas</dt>
          <dd className="font-medium">{activeListings}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Baixo estoque</dt>
          <dd className="font-medium">{lowStockCount}</dd>
        </div>
      </dl>
    </section>
  );
}
