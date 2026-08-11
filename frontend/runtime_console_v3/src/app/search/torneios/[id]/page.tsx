"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useReducedMotion } from "motion/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { GalleryCountUp } from "@/components/gallery/GalleryMotion";
import GradualBlur from "@/components/react-bits/GradualBlur";
import Magnet from "@/components/react-bits/Magnet";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { useJudgeAuth } from "@/features/auth/AuthProvider";
import { useJudgeToast } from "@/hooks/use-judge-toast";
import { SHOP_CART_QUERY_KEY } from "@/hooks/useShopCart";
import { addProductToCart } from "@/lib/marketplace-shop";
import { useCartStore } from "@/stores/cartStore";
import { formatEventPriceBrl, normalizeStoreEvent, type StoreEventRow } from "@/types/store-event";

/** Detalhe público de store_event com CTA de carrinho. */
export default function StoreEventDetailPage() {
  const params = useParams<{ id: string }>();
  const eventId = params?.id ?? "";
  const { user, loading: authLoading } = useJudgeAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const openCart = useCartStore((s) => s.openCart);
  const { cart: cartToast, error: errorToast } = useJudgeToast();
  const [adding, setAdding] = useState(false);
  const reduceMotion = useReducedMotion();

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
  const productId = ev?.storeProductId ?? null;
  const ctaEnabled = Boolean(registrationOpen && !soldOut && productId);

  async function handleAddToCart() {
    if (!productId) return;
    if (authLoading) return;
    if (!user) {
      router.push(`/entrar?next=${encodeURIComponent(`/search/torneios/${eventId}`)}`);
      return;
    }
    setAdding(true);
    try {
      const result = await addProductToCart(productId, 1);
      if (result.ok) {
        void qc.invalidateQueries({ queryKey: SHOP_CART_QUERY_KEY });
        cartToast(ev?.name ?? "Ingresso");
        openCart();
        return;
      }
      if (result.needsLogin) {
        router.push(`/entrar?next=${encodeURIComponent(`/search/torneios/${eventId}`)}`);
        return;
      }
      errorToast(result.message);
    } finally {
      setAdding(false);
    }
  }

  const ctaButton = ctaEnabled ? (
    <Button
      data-testid="event-detail-cta"
      disabled={adding}
      onClick={() => void handleAddToCart()}
    >
      {adding ? "Adicionando…" : "Adicionar ao carrinho"}
    </Button>
  ) : (
    <Button disabled data-testid="event-detail-cta">
      {soldOut
        ? "Esgotado"
        : !productId
          ? "Ingresso indisponível"
          : "Inscrições fechadas"}
    </Button>
  );

  return (
    <MobileLayout>
      <div className="container mx-auto max-w-3xl space-y-6 px-4 py-8" data-testid="store-event-detail">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Eventos", href: "/search/torneios" },
            { label: ev?.name ?? "Evento" },
          ]}
        />

        {q.isLoading && <p className="text-sm text-muted-foreground">Carregando evento…</p>}
        {q.isError && (
          <div className="rounded-xl border border-border px-4 py-8 text-center">
            <p className="font-medium">Evento não encontrado</p>
            <Link
              href="/search/torneios"
              className="mt-3 inline-block text-sm text-primary hover:underline"
            >
              Voltar aos eventos
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
                  <span className="rounded-full border border-border px-2 py-0.5 text-caption uppercase tracking-wide text-muted-foreground">
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
                  <span className="text-muted-foreground tabular-nums">
                    <GalleryCountUp to={remaining} className="inline" duration={1} />/
                    <GalleryCountUp to={capacity} className="inline" duration={1} /> vagas
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
                <div className="relative max-h-48 overflow-hidden rounded-lg border border-border/60 bg-muted/20 p-3">
                  <p className="whitespace-pre-wrap pb-8 text-sm text-muted-foreground">{ev.rules}</p>
                  {!reduceMotion && (
                    <GradualBlur
                      preset="subtle"
                      position="bottom"
                      height="3.5rem"
                      strength={1.2}
                      opacity={0.9}
                      target="parent"
                      className="pointer-events-none"
                    />
                  )}
                </div>
              )}
              <div className="pt-2">
                {reduceMotion || !ctaEnabled ? (
                  ctaButton
                ) : (
                  <Magnet
                    padding={48}
                    magnetStrength={3}
                    wrapperClassName="inline-flex"
                    innerClassName="inline-flex"
                  >
                    {ctaButton}
                  </Magnet>
                )}
              </div>
            </div>
          </article>
        )}
      </div>
    </MobileLayout>
  );
}
