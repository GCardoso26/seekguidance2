"use client";

import Link from "next/link";
import { OperationalCommandCenter } from "@/components/seller-dashboard/overview/OperationalCommandCenter";
import { PageHeader, PageShell } from "@/components/seller-dashboard/PageShell";
import { SellerHeader } from "@/components/seller-dashboard/SellerHeader";
import { useOperationalSnapshot } from "@/hooks/useOperationalSnapshot";
import { useSupportTickets } from "@/hooks/useSupportTickets";
import { useFinanceChargebacks } from "@/hooks/useSellerFinanceS6";
import { formatShopPrice } from "@/lib/marketplace-shop";
import { ticketStatusLabel } from "@/lib/ticket-labels";

function QueueSection({
  title,
  children,
  href,
}: {
  title: string;
  children: React.ReactNode;
  href?: string;
}) {
  return (
    <section className="rounded-xl border border-border bg-muted/40 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">{title}</h2>
        {href && (
          <Link href={href} className="text-xs text-primary hover:underline">
            Ver todos →
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

export default function OperacaoPage() {
  const { actions, isLoading, overview, refetch } = useOperationalSnapshot();
  const tickets = useSupportTickets("open");
  const chargebacks = useFinanceChargebacks();

  return (
    <>
      <SellerHeader subtitle="Centro operacional da loja" action={null} />
      <PageShell>
        <PageHeader
          title="Operação"
          description="Filas de trabalho priorizadas — resolva o que mais impacta a loja."
          action={
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted/80"
            >
              Atualizar
            </button>
          }
        />

        <OperationalCommandCenter actions={actions} isLoading={isLoading} compact />

        <div className="grid gap-4 lg:grid-cols-2">
          <QueueSection title="Pedidos recentes" href="/vendedor/painel/pedidos">
            <ul className="space-y-2 text-sm">
              {(overview?.recent_orders ?? []).slice(0, 5).map((o) => (
                <li key={o.id} className="flex justify-between rounded-lg border border-border/60 px-3 py-2">
                  <span className="truncate">{o.customer_name ?? `Pedido ${o.id.slice(0, 8)}`}</span>
                  <span className="text-primary">{formatShopPrice(o.total_cents)}</span>
                </li>
              ))}
              {(overview?.recent_orders?.length ?? 0) === 0 && (
                <li className="text-muted-foreground">Nenhum pedido recente.</li>
              )}
            </ul>
          </QueueSection>

          <QueueSection title="Tickets abertos" href="/vendedor/painel/atendimento/tickets">
            <ul className="space-y-2 text-sm">
              {(tickets.data?.tickets ?? []).slice(0, 5).map((t) => (
                <li key={t.id} className="flex justify-between gap-2 rounded-lg border border-border/60 px-3 py-2">
                  <span className="truncate">{t.subject}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{ticketStatusLabel(t.status)}</span>
                </li>
              ))}
              {(tickets.data?.tickets?.length ?? 0) === 0 && (
                <li className="text-muted-foreground">Nenhum ticket aberto.</li>
              )}
            </ul>
          </QueueSection>

          <QueueSection title="Chargebacks" href="/vendedor/painel/financeiro/chargebacks">
            <ul className="space-y-2 text-sm">
              {(chargebacks.data?.items ?? []).slice(0, 5).map((c) => (
                <li key={c.id} className="flex justify-between rounded-lg border border-border/60 px-3 py-2">
                  <span>{c.reason ?? "Disputa"}</span>
                  <span className="text-amber-300">{formatShopPrice(c.amount_cents)}</span>
                </li>
              ))}
              {(chargebacks.data?.items?.length ?? 0) === 0 && (
                <li className="text-muted-foreground">Nenhum chargeback aberto.</li>
              )}
            </ul>
          </QueueSection>

          <QueueSection title="Estoque crítico" href="/vendedor/painel/estoque">
            <ul className="space-y-2 text-sm">
              {(overview?.low_stock ?? []).slice(0, 5).map((item) => (
                <li key={item.id} className="flex justify-between rounded-lg border border-border/60 px-3 py-2">
                  <span className="truncate">{item.title}</span>
                  <span className="text-danger">×{item.stock}</span>
                </li>
              ))}
              {(overview?.low_stock?.length ?? 0) === 0 && (
                <li className="text-muted-foreground">Estoque OK.</li>
              )}
            </ul>
          </QueueSection>
        </div>
      </PageShell>
    </>
  );
}
