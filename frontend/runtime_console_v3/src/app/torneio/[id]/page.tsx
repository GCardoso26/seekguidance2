"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { formatEventPriceBrl, normalizeStoreEvent, type StoreEventRow } from "@/types/store-event";

function phoneTelHref(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits ? `tel:+55${digits}` : `tel:${phone}`;
}

/** Detalhe de store_event. Segmento dinâmico deve ser `[id]` (já usado por ops-dashboard). */
export default function StoreEventDetailPage() {
  const params = useParams<{ id: string }>();
  const eventId = params?.id ?? "";

  const q = useQuery({
    queryKey: ["store-event-detail", eventId],
    queryFn: async (): Promise<StoreEventRow> => {
      const res = await fetch(`/api/tournament-platform/events/${encodeURIComponent(eventId)}`, {
        cache: "no-store",
      });
      if (res.status === 404) throw new Error("not_found");
      if (!res.ok) throw new Error("fetch_failed");
      const data = (await res.json()) as { event?: Record<string, unknown> };
      if (!data.event) throw new Error("not_found");
      return normalizeStoreEvent(data.event);
    },
    enabled: Boolean(eventId),
    staleTime: 30_000,
    retry: false,
  });

  const ev = q.data;
  const remaining = ev?.ticketsRemaining;
  const capacity = ev?.ticketsCapacity ?? ev?.capacity ?? null;
  const soldOut = remaining != null ? remaining <= 0 : false;
  const registrationOpen = ev?.status === "registration_open";
  const ctaEnabled = Boolean(registrationOpen && !soldOut);

  return (
    <MobileLayout>
      <div className="container mx-auto max-w-3xl space-y-6 px-4 py-8" data-testid="store-event-detail">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Tournament Hub", href: "/torneio" },
            { label: ev?.name ?? "Evento" },
          ]}
        />

        {q.isLoading && <p className="text-sm text-muted-foreground">Carregando evento…</p>}
        {q.isError && (
          <div className="rounded-xl border border-border px-4 py-8 text-center">
            <p className="font-medium">Evento não encontrado</p>
            <Link href="/torneio" className="mt-3 inline-block text-sm text-primary hover:underline">
              Voltar ao hub
            </Link>
          </div>
        )}

        {ev && (
          <article className="flex flex-col gap-6 sm:flex-row">
            {ev.bannerUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={ev.bannerUrl}
                alt=""
                className="mx-auto aspect-[7/10] w-[180px] shrink-0 rounded-xl object-cover sm:mx-0"
              />
            ) : (
              <div className="mx-auto flex aspect-[7/10] w-[180px] shrink-0 items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground sm:mx-0">
                Sem banner
              </div>
            )}
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl font-semibold tracking-tight">{ev.name}</h1>
                {ev.game && (
                  <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                    {ev.game}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {ev.startsAt ? new Date(ev.startsAt).toLocaleString("pt-BR") : "Data a definir"}
                {ev.format ? ` · ${ev.format}` : ""}
              </p>
              <p className="text-sm text-muted-foreground">
                {ev.storeSlug ? (
                  <Link href={`/stores/${ev.storeSlug}`} className="text-primary hover:underline">
                    {ev.storeName ?? "Loja"}
                  </Link>
                ) : (
                  (ev.storeName ?? "Loja")
                )}
                {ev.addressCity && ev.addressState
                  ? ` · ${ev.addressCity}/${ev.addressState}`
                  : ev.venue
                    ? ` · ${ev.venue}`
                    : ""}
              </p>
              <p className="text-sm">
                <span className="font-medium">{formatEventPriceBrl(ev.priceCents)}</span>
                {" · "}
                {soldOut ? (
                  <span className="font-medium text-danger">Esgotado</span>
                ) : remaining != null && capacity != null ? (
                  <span className="text-muted-foreground">
                    {remaining}/{capacity} vagas
                  </span>
                ) : (
                  <span className="text-muted-foreground">Vagas sob consulta</span>
                )}
              </p>
              <p className="text-xs">
                {registrationOpen && !soldOut ? (
                  <span className="rounded-md bg-emerald-500/15 px-2 py-1 text-emerald-300">
                    Inscrições abertas
                  </span>
                ) : soldOut ? (
                  <span className="rounded-md bg-danger/15 px-2 py-1 text-danger">Esgotado</span>
                ) : (
                  <span className="rounded-md bg-muted px-2 py-1 text-muted-foreground">
                    Inscrições fechadas
                  </span>
                )}
              </p>
              {ev.description && <p className="text-sm text-muted-foreground">{ev.description}</p>}
              {ev.rules && (
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{ev.rules}</p>
              )}
              {ev.contactPhone && (
                <p className="text-sm text-muted-foreground">Telefone: {ev.contactPhone}</p>
              )}
              <div className="pt-2">
                {ctaEnabled && ev.contactPhone ? (
                  <Button asChild data-testid="event-detail-cta">
                    <a href={phoneTelHref(ev.contactPhone)}>Garantir vaga</a>
                  </Button>
                ) : ctaEnabled ? (
                  <Button disabled data-testid="event-detail-cta">
                    Fale com a loja
                  </Button>
                ) : (
                  <Button disabled data-testid="event-detail-cta">
                    {soldOut ? "Esgotado" : "Inscrições fechadas"}
                  </Button>
                )}
              </div>
            </div>
          </article>
        )}
      </div>
    </MobileLayout>
  );
}
