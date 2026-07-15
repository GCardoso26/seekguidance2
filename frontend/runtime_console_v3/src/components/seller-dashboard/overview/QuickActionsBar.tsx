"use client";

import Link from "next/link";

/** BP 5.1 — menos decisões: estoque primeiro. */
export function QuickActionsBar() {
  return (
    <section className="rounded-lg border border-border bg-card p-4" data-testid="quick-actions-bar">
      <h2 className="mb-3 text-small font-semibold text-muted-foreground">Próximo passo</h2>
      <div className="flex flex-wrap gap-2">
        <Link
          href="/vendedor/painel/listagens/nova"
          className="min-h-11 rounded-md bg-primary px-4 py-2 text-small font-semibold text-primary-foreground"
        >
          Cadastrar carta
        </Link>
        <Link
          href="/vendedor/painel/estoque"
          className="min-h-11 rounded-md border border-border px-4 py-2 text-small hover:bg-muted"
        >
          Importar CSV
        </Link>
      </div>
    </section>
  );
}
