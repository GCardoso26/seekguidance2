"use client";

import Link from "next/link";

type Props = {
  count: number;
};

export function TicketsWidget({ count }: Props) {
  return (
    <section className="rounded-xl border border-white/10 bg-white/5 p-4" data-testid="tickets-widget">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-luxury-mist">
        Tickets
      </h2>
      {count > 0 ? (
        <p className="text-sm">
          <span className="font-semibold text-amber-200">{count}</span>{" "}
          aguardando resposta
        </p>
      ) : (
        <p className="text-sm text-luxury-mist">Nenhum ticket aberto.</p>
      )}
      <Link
        href="/vendedor/painel/atendimento/tickets"
        className="mt-3 inline-block text-sm text-luxury-gold hover:underline"
      >
        Ver tickets →
      </Link>
    </section>
  );
}
