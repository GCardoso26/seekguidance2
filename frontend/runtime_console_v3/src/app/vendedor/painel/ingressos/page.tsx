"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EventTicketCreateModal } from "@/components/seller-dashboard/event-tickets/EventTicketCreateModal";
import { EventTicketEditModal } from "@/components/seller-dashboard/event-tickets/EventTicketEditModal";
import {
  AsyncPageBody,
  PageEmpty,
  PageError,
  PageHeader,
  PageShell,
  PageSkeleton,
} from "@/components/seller-dashboard/PageShell";
import { SellerHeader } from "@/components/seller-dashboard/SellerHeader";
import { Button } from "@/components/ui/button";
import { useSellerStore } from "@/hooks/useSellerStore";
import { useSellerStoreEvents } from "@/hooks/useSellerStoreEvents";
import { formatShopPrice } from "@/lib/marketplace-shop";
import { planHasFeature } from "@/lib/seller-plans";
import { formatEventPriceBrl, type StoreEventRow } from "@/types/store-event";

type CounterOrder = {
  id: string;
  status: string;
  total_cents: number;
  expires_at?: string | null;
  created_at?: string | null;
  buyer_id?: string;
  items?: Array<{ product_name?: string; quantity?: number; unit_price_cents?: number }>;
};

function CounterOrdersSection({ storeId }: { storeId: string }) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["seller-counter-orders", storeId],
    queryFn: async (): Promise<CounterOrder[]> => {
      const res = await fetch(
        `/api/marketplace/shop/stores/${encodeURIComponent(storeId)}/counter-orders`,
        { cache: "no-store" },
      );
      if (!res.ok) throw new Error("counter_orders_failed");
      const data = (await res.json()) as { orders?: CounterOrder[] };
      return data.orders ?? [];
    },
    staleTime: 15_000,
  });

  const confirm = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await fetch(
        `/api/marketplace/shop/orders/${encodeURIComponent(orderId)}/confirm-counter`,
        { method: "POST" },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          typeof body.detail === "string" ? body.detail : "Falha ao confirmar pagamento",
        );
      }
      return res.json();
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["seller-counter-orders", storeId] });
      void qc.invalidateQueries({ queryKey: ["seller-store-events", storeId] });
    },
  });

  const orders = q.data ?? [];

  return (
    <section className="space-y-3" data-testid="counter-orders-section">
      <h2 className="text-lg font-semibold">Pedidos balcão (ingressos)</h2>
      <p className="text-sm text-muted-foreground">
        Confirme o pagamento na loja em até 24h — senão a vaga é liberada automaticamente.
      </p>
      {q.isLoading && <p className="text-sm text-muted-foreground">Carregando pedidos…</p>}
      {q.isError && (
        <p className="text-sm text-danger">Não foi possível carregar pedidos balcão.</p>
      )}
      {!q.isLoading && orders.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhum pedido aguardando confirmação.</p>
      )}
      <ul className="space-y-2">
        {orders.map((o) => (
          <li
            key={o.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border px-4 py-3"
          >
            <div className="min-w-0 text-sm">
              <p className="font-medium">{formatShopPrice(o.total_cents)}</p>
              <p className="text-xs text-muted-foreground">
                {(o.items ?? []).map((i) => i.product_name).filter(Boolean).join(", ") || "Ingresso"}
                {o.expires_at
                  ? ` · expira ${new Date(o.expires_at).toLocaleString("pt-BR")}`
                  : ""}
              </p>
            </div>
            <Button
              size="sm"
              data-testid={`confirm-counter-${o.id}`}
              disabled={confirm.isPending}
              onClick={() => confirm.mutate(o.id)}
            >
              Confirmar pagamento
            </Button>
          </li>
        ))}
      </ul>
      {confirm.isError && (
        <p className="text-sm text-danger">
          {confirm.error instanceof Error ? confirm.error.message : "Erro ao confirmar"}
        </p>
      )}
    </section>
  );
}

export default function IngressosPage() {
  const { storeId, store, hasStore, plan, isLoading: storeLoading } = useSellerStore();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<StoreEventRow | null>(null);
  const canTournaments = planHasFeature(plan, "tournaments");

  const { data, isLoading, isError, error, refetch } = useSellerStoreEvents(
    hasStore && canTournaments ? storeId : null,
  );

  function onUpdated() {
    void qc.invalidateQueries({ queryKey: ["seller-store-events", storeId] });
    void qc.invalidateQueries({ queryKey: ["tournament-hub-events"] });
    void qc.invalidateQueries({ queryKey: ["search-torneios-events"] });
    void refetch();
  }

  if (storeLoading) {
    return (
      <PageShell>
        <PageSkeleton rows={4} />
      </PageShell>
    );
  }

  if (!hasStore) {
    return (
      <PageShell>
        <PageEmpty
          variant="panel"
          title="Cadastre sua loja para publicar ingressos"
          action={{ label: "Cadastrar loja", href: "/vendedor/painel/onboarding" }}
        />
      </PageShell>
    );
  }

  if (!canTournaments) {
    return (
      <PageShell>
        <PageEmpty
          variant="panel"
          title="Seu plano não inclui eventos. Veja opções em Planos."
          action={{ label: "Ver planos", href: "/planos" }}
        />
      </PageShell>
    );
  }

  if (error instanceof Error && error.message === "login_required") {
    return (
      <PageShell>
        <PageEmpty
          variant="panel"
          title="Faça login para gerenciar ingressos"
          action={{ label: "Entrar", href: "/entrar?next=/vendedor/painel/ingressos" }}
        />
      </PageShell>
    );
  }

  const events = data ?? [];

  return (
    <>
      <SellerHeader
        action={
          <Button data-testid="event-ticket-new-btn" onClick={() => setCreateOpen(true)}>
            Novo evento
          </Button>
        }
      />
      <PageShell className="space-y-6">
        <PageHeader
          title="Ingressos de Eventos"
          description="Publique eventos na vitrine da loja e em Eventos (/search/torneios)."
        />

        {storeId && <CounterOrdersSection storeId={storeId} />}

        {isError ? (
          <PageError message="Não foi possível carregar os eventos." onRetry={() => void refetch()} />
        ) : (
          <AsyncPageBody isLoading={isLoading} skeletonRows={5}>
            {events.length === 0 ? (
              <div
                className="rounded-xl border border-dashed border-border px-6 py-12 text-center"
                data-testid="events-empty"
              >
                <p className="text-sm text-muted-foreground">
                  Nenhum evento ainda — crie o primeiro.
                </p>
                <Button className="mt-4" onClick={() => setCreateOpen(true)}>
                  Criar evento
                </Button>
              </div>
            ) : (
              <ul className="space-y-3" data-testid="seller-events-list">
                {events.map((ev) => (
                  <li
                    key={ev.id}
                    className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card/40 p-4"
                  >
                    {ev.bannerUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={ev.bannerUrl}
                        alt=""
                        className="h-20 w-14 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-20 w-14 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
                        —
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{ev.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {ev.startsAt
                          ? new Date(ev.startsAt).toLocaleString("pt-BR")
                          : "Sem data"}{" "}
                        · {ev.game ?? "—"} ·{" "}
                        {ev.addressCity && ev.addressState
                          ? `${ev.addressCity}/${ev.addressState}`
                          : ev.venue ?? "—"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatEventPriceBrl(ev.priceCents)} · Vagas:{" "}
                        {ev.ticketsRemaining != null && ev.ticketsCapacity != null
                          ? `${ev.ticketsRemaining}/${ev.ticketsCapacity}`
                          : ev.capacity ?? "—"}{" "}
                        ·{" "}
                        {ev.status === "registration_open"
                          ? "Inscrições abertas"
                          : ev.status === "published"
                            ? "Inscrições fechadas"
                            : ev.status}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        data-testid={`event-edit-btn-${ev.id}`}
                        onClick={() => setEditEvent(ev)}
                      >
                        Editar
                      </Button>
                      <Link
                        href={`/search/torneios/${ev.id}`}
                        className="inline-flex items-center text-xs text-primary hover:underline"
                      >
                        Ver página →
                      </Link>
                      {store?.slug && (
                        <Link
                          href={`/stores/${store.slug}`}
                          className="inline-flex items-center text-xs text-primary hover:underline"
                        >
                          Vitrine →
                        </Link>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </AsyncPageBody>
        )}
      </PageShell>

      {storeId && (
        <>
          <EventTicketCreateModal
            storeId={storeId}
            store={store}
            open={createOpen}
            onOpenChange={setCreateOpen}
            onCreated={onUpdated}
          />
          <EventTicketEditModal
            storeId={storeId}
            event={editEvent}
            open={Boolean(editEvent)}
            onOpenChange={(open) => {
              if (!open) setEditEvent(null);
            }}
            onUpdated={onUpdated}
          />
        </>
      )}
    </>
  );
}
