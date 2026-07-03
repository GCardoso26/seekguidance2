"use client";

import Link from "next/link";

export function QuickActionsBar() {
  return (
    <section
      className="rounded-xl border border-white/10 bg-white/5 p-4"
      data-testid="quick-actions-bar"
    >
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-luxury-mist">
        Ações rápidas
      </h2>
      <div className="flex flex-wrap gap-2">
        <Link
          href="/vendedor/painel/catalogo/cartas?action=new"
          className="rounded-lg bg-luxury-gold px-4 py-2 text-sm font-semibold text-luxury-onyx"
        >
          + Novo anúncio
        </Link>
        <Link
          href="/vendedor/painel/pdv"
          className="rounded-lg border border-white/20 px-4 py-2 text-sm hover:bg-white/5"
        >
          + Novo pedido manual
        </Link>
        <Link
          href="/vendedor/painel/atendimento/tickets?action=new"
          className="rounded-lg border border-white/20 px-4 py-2 text-sm hover:bg-white/5"
        >
          + Ticket
        </Link>
      </div>
    </section>
  );
}
