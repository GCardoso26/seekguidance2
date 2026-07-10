"use client";

import Link from "next/link";

export function QuickActionsBar() {
  return (
    <section
      className="surface-card p-4"
      data-testid="quick-actions-bar"
    >
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Ações rápidas
      </h2>
      <div className="flex flex-wrap gap-2">
        <Link
          href="/vendedor/painel/listagens/nova"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          + Novo anúncio
        </Link>
        <Link
          href="/vendedor/painel/pdv"
          className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted/80"
        >
          + Novo pedido manual
        </Link>
        <Link
          href="/vendedor/painel/atendimento/tickets?action=new"
          className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted/80"
        >
          + Ticket
        </Link>
      </div>
    </section>
  );
}
