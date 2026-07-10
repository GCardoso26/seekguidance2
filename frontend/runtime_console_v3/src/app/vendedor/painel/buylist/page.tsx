"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BuylistPixPayment } from "@/components/seller-dashboard/BuylistPixPayment";
import {
  AsyncPageBody,
  PageEmpty,
  PageHeader,
  PageShell,
  PageSkeleton,
} from "@/components/seller-dashboard/PageShell";
import { SellerHeader } from "@/components/seller-dashboard/SellerHeader";
import { InlineAlert } from "@/components/ui/async-state";
import { Button } from "@/components/ui/button";
import { useSellerStore } from "@/hooks/useSellerStore";
import { planHasFeature } from "@/lib/seller-plans";

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function BuylistPageContent() {
  const searchParams = useSearchParams();
  const paySubmissionId = searchParams.get("pay");
  const { storeId, hasStore, dashboard, isLoading: storeLoading } = useSellerStore();
  const plan = String((dashboard?.store as Record<string, unknown> | undefined)?.subscription_plan ?? "free");
  const qc = useQueryClient();
  const [title, setTitle] = useState("Compro sua coleção");
  const [cardName, setCardName] = useState("");
  const [items, setItems] = useState<Array<{ card_name: string; quantity: number }>>([]);

  const buylistEnabled = Boolean(storeId) && planHasFeature(plan, "buylist");

  const {
    data,
    isLoading,
    isError: buylistsError,
    refetch: refetchBuylists,
  } = useQuery({
    queryKey: ["seller-buylists", storeId],
    queryFn: async () => {
      const res = await fetch(`/api/marketplace/shop/stores/${encodeURIComponent(storeId!)}/buylists`);
      if (!res.ok) throw new Error("fetch_failed");
      return res.json() as Promise<{ buylists: Array<Record<string, unknown>> }>;
    },
    enabled: buylistEnabled,
  });

  const {
    data: submissionsData,
    isError: submissionsError,
    refetch: refetchSubmissions,
  } = useQuery({
    queryKey: ["seller-buylist-submissions", storeId],
    queryFn: async () => {
      const res = await fetch(
        `/api/marketplace/shop/stores/${encodeURIComponent(storeId!)}/buylists/submissions?status=pending`,
      );
      if (!res.ok) throw new Error("fetch_failed");
      return res.json() as Promise<{ submissions: Array<Record<string, unknown>> }>;
    },
    enabled: buylistEnabled,
  });

  const {
    data: acceptedData,
    isError: acceptedError,
    refetch: refetchAccepted,
  } = useQuery({
    queryKey: ["seller-buylist-accepted", storeId],
    queryFn: async () => {
      const res = await fetch(
        `/api/marketplace/shop/stores/${encodeURIComponent(storeId!)}/buylists/submissions?status=accepted`,
      );
      if (!res.ok) throw new Error("fetch_failed");
      return res.json() as Promise<{ submissions: Array<Record<string, unknown>> }>;
    },
    enabled: buylistEnabled,
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "accepted" | "rejected" }) => {
      const res = await fetch(
        `/api/marketplace/shop/stores/${encodeURIComponent(storeId!)}/buylists/submissions/${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(String((err as { detail?: string }).detail ?? "Erro"));
      }
      return res.json();
    },
    onSuccess: () => {
      void refetchSubmissions();
      void refetchAccepted();
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title,
        discount_pct: 0.3,
        items: items.length ? items : [{ card_name: cardName, quantity: 1 }],
      };
      const res = await fetch(`/api/marketplace/shop/stores/${encodeURIComponent(storeId!)}/buylists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(String((err as { detail?: string }).detail ?? "Erro ao criar"));
      }
      return res.json();
    },
    onSuccess: () => {
      setItems([]);
      setCardName("");
      void qc.invalidateQueries({ queryKey: ["seller-buylists", storeId] });
    },
  });

  const fetchError = buylistsError || submissionsError || acceptedError;

  function refetchAll() {
    void refetchBuylists();
    void refetchSubmissions();
    void refetchAccepted();
  }

  if (storeLoading) {
    return (
      <PageShell>
        <PageSkeleton rows={6} />
      </PageShell>
    );
  }

  if (!hasStore) {
    return (
      <PageShell>
        <PageEmpty
          variant="panel"
          title="Cadastre sua loja para usar BuyList"
          action={{ label: "Cadastrar loja", href: "/stores/create" }}
        />
      </PageShell>
    );
  }

  if (!planHasFeature(plan, "buylist")) {
    return (
      <>
        <SellerHeader />
        <PageShell>
          <PageEmpty
            variant="panel"
            title="BuyList disponível no plano Lojista"
            action={{ label: "Ver planos", href: "/vendedor/painel/planos" }}
          />
        </PageShell>
      </>
    );
  }

  return (
    <>
      <SellerHeader />
      <PageShell className="space-y-6">
        <PageHeader
          title="BuyList"
          description="Crie ofertas de compra com link público (~30% abaixo do mercado)."
        />

        <AsyncPageBody
          isLoading={isLoading}
          isError={fetchError}
          onRetry={refetchAll}
          errorMessage="Não foi possível carregar as buylists."
          skeletonRows={6}
        >
          <div className="space-y-3 surface-card p-4">
            <h3 className="font-semibold">Nova oferta</h3>
            <input
              className="w-full rounded-lg border border-border bg-black/30 px-3 py-2 text-sm"
              placeholder="Título da oferta"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-lg border border-border bg-black/30 px-3 py-2 text-sm"
                placeholder="Nome da carta"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (!cardName.trim()) return;
                  setItems((prev) => [...prev, { card_name: cardName.trim(), quantity: 1 }]);
                  setCardName("");
                }}
              >
                + Item
              </Button>
            </div>
            {items.length > 0 && (
              <ul className="text-sm text-muted-foreground">
                {items.map((it, i) => (
                  <li key={`${it.card_name}-${i}`}>• {it.card_name}</li>
                ))}
              </ul>
            )}
            <Button
              disabled={createMutation.isPending || (!items.length && !cardName.trim())}
              onClick={() => void createMutation.mutate()}
            >
              {createMutation.isPending ? "Criando…" : "Gerar link"}
            </Button>
            {createMutation.isError && (
              <InlineAlert message={(createMutation.error as Error).message} />
            )}
          </div>

          <div className="surface-card p-4">
            <h3 className="mb-3 font-semibold">Ofertas ativas</h3>
            {(data?.buylists ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma oferta ainda.</p>
            ) : (
              <ul className="space-y-3">
                {(data?.buylists ?? []).map((b) => (
                  <li key={String(b.id)} className="rounded-lg border border-border p-3 text-sm">
                    <p className="font-medium">{String(b.title)}</p>
                    <p className="text-muted-foreground">
                      {String(b.item_count)} itens · {formatBRL(Number(b.total_offer_cents ?? 0))}
                    </p>
                    <Link
                      href={`/buylist/${String(b.public_token)}`}
                      className="mt-2 inline-block text-primary underline"
                      target="_blank"
                    >
                      Abrir link público
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="surface-card p-4">
            <h3 className="mb-3 font-semibold">Propostas pendentes</h3>
            {(submissionsData?.submissions ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma proposta aguardando.</p>
            ) : (
              <ul className="space-y-3">
                {(submissionsData?.submissions ?? []).map((s) => (
                  <li key={String(s.id)} className="rounded-lg border border-border p-3 text-sm">
                    <p className="font-medium">{String(s.buylist_title ?? "BuyList")}</p>
                    <p className="text-muted-foreground">{formatBRL(Number(s.total_offer_cents ?? 0))}</p>
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="sm"
                        disabled={reviewMutation.isPending}
                        onClick={() => void reviewMutation.mutate({ id: String(s.id), status: "accepted" })}
                      >
                        Aceitar + Escrow
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={reviewMutation.isPending}
                        onClick={() => void reviewMutation.mutate({ id: String(s.id), status: "rejected" })}
                      >
                        Recusar
                      </Button>
                    </div>
                    {Boolean(s.shop_order_id) && (
                      <Link
                        href={`/vendedor/painel/vendas/${String(s.shop_order_id)}`}
                        className="mt-2 inline-block text-primary underline"
                      >
                        Ver pedido escrow
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="surface-card p-4">
            <h3 className="mb-3 font-semibold">Aceitas — aguardando PIX</h3>
            {(acceptedData?.submissions ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma proposta aceita pendente de pagamento.</p>
            ) : (
              <ul className="space-y-3">
                {(acceptedData?.submissions ?? []).map((s) => {
                  const id = String(s.id);
                  const needsPay = s.order_status === "pending" || !s.order_pix_txid;
                  const highlight = paySubmissionId === id;
                  return (
                    <li
                      key={id}
                      id={`submission-${id}`}
                      className={`rounded-lg border p-3 text-sm ${
                        highlight ? "border-amber-500/50 bg-amber-500/5" : "border-border"
                      }`}
                    >
                      <p className="font-medium">{String(s.buylist_title ?? "BuyList")}</p>
                      <p className="text-muted-foreground">{formatBRL(Number(s.total_offer_cents ?? 0))}</p>
                      {Boolean(s.shop_order_id) && (
                        <Link
                          href={`/vendedor/painel/vendas/${String(s.shop_order_id)}`}
                          className="mt-1 inline-block text-primary underline"
                        >
                          Ver pedido escrow
                        </Link>
                      )}
                      {needsPay && storeId && (
                        <BuylistPixPayment
                          storeId={storeId}
                          submissionId={id}
                          title={String(s.buylist_title ?? "")}
                          amountCents={Number(s.total_offer_cents ?? 0)}
                        />
                      )}
                      {!needsPay && (
                        <p className="mt-2 text-xs text-emerald-400">PIX gerado — aguardando confirmação</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </AsyncPageBody>
      </PageShell>
    </>
  );
}

export default function BuylistPage() {
  return (
    <Suspense
      fallback={
        <PageShell>
          <PageSkeleton rows={6} />
        </PageShell>
      }
    >
      <BuylistPageContent />
    </Suspense>
  );
}
