"use client";

import Link from "next/link";

type Props = {
  count: number;
};

export function TicketsWidget({ count }: Props) {
  return (
    <section className="surface-card p-4" data-testid="tickets-widget">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Tickets
      </h2>
      {count > 0 ? (
        <p className="text-sm">
          <span className="font-semibold text-amber-200">{count}</span>{" "}
          aguardando resposta
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">Nenhum ticket aberto.</p>
      )}
      <Link
        href="/vendedor/painel/atendimento/tickets"
        className="mt-3 inline-block text-sm text-primary hover:underline"
      >
        Ver tickets →
      </Link>
    </section>
  );
}
