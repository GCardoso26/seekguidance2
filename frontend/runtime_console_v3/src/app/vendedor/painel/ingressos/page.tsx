"use client";

import { useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { EventTicketCreateModal } from "@/components/seller-dashboard/event-tickets/EventTicketCreateModal";
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
import { planHasFeature } from "@/lib/seller-plans";

export default function IngressosPage() {
  const { storeId, store, hasStore, plan, isLoading: storeLoading } = useSellerStore();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const canTournaments = planHasFeature(plan, "tournaments");

  const { data, isLoading, isError, error, refetch } = useSellerStoreEvents(
    hasStore && canTournaments ? storeId : null,
  );

  function onUpdated() {
    void qc.invalidateQueries({ queryKey: ["seller-store-events", storeId] });
    void qc.invalidateQueries({ queryKey: ["tournament-hub-events"] });
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
          description="Publique eventos na vitrine da loja e no Tournament Hub."
        />

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
                        Vagas:{" "}
                        {ev.ticketsRemaining != null && ev.ticketsCapacity != null
                          ? `${ev.ticketsRemaining}/${ev.ticketsCapacity}`
                          : ev.capacity ?? "—"}{" "}
                        · {ev.status}
                      </p>
                    </div>
                    {store?.slug && (
                      <Link
                        href={`/stores/${store.slug}`}
                        className="text-xs text-primary hover:underline"
                      >
                        Ver vitrine →
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </AsyncPageBody>
        )}
      </PageShell>

      {storeId && (
        <EventTicketCreateModal
          storeId={storeId}
          store={store}
          open={createOpen}
          onOpenChange={setCreateOpen}
          onCreated={onUpdated}
        />
      )}
    </>
  );
}
