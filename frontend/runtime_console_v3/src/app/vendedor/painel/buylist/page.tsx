"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SellerHeader } from "@/components/seller-dashboard/SellerHeader";
import { Button } from "@/components/ui/button";
import { useSellerStore } from "@/hooks/useSellerStore";
import { planHasFeature } from "@/lib/seller-plans";

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function BuylistPage() {
  const { storeId, hasStore, dashboard } = useSellerStore();
  const plan = String((dashboard?.store as Record<string, unknown> | undefined)?.subscription_plan ?? "free");
  const qc = useQueryClient();
  const [title, setTitle] = useState("Compro sua coleção");
  const [cardName, setCardName] = useState("");
  const [items, setItems] = useState<Array<{ card_name: string; quantity: number }>>([]);

  const { data, isLoading } = useQuery({
    queryKey: ["seller-buylists", storeId],
    queryFn: async () => {
      const res = await fetch(`/api/marketplace/shop/stores/${encodeURIComponent(storeId!)}/buylists`);
      if (!res.ok) throw new Error("fetch_failed");
      return res.json() as Promise<{ buylists: Array<Record<string, unknown>> }>;
    },
    enabled: Boolean(storeId) && planHasFeature(plan, "buylist"),
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

  if (!hasStore) {
    return (
      <main className="p-8 text-center text-luxury-mist">
        <Link href="/stores/create" className="text-luxury-gold underline">
          Cadastre sua loja
        </Link>
      </main>
    );
  }

  if (!planHasFeature(plan, "buylist")) {
    return (
      <main className="p-8 text-center">
        <p className="text-luxury-mist">BuyList disponível no plano Lojista.</p>
        <Button asChild className="mt-4">
          <Link href="/vendedor/painel/planos">Ver planos</Link>
        </Button>
      </main>
    );
  }

  return (
    <>
      <SellerHeader />
      <main className="flex-1 space-y-6 overflow-y-auto p-6">
        <div>
          <h2 className="text-xl font-bold">BuyList</h2>
          <p className="text-sm text-luxury-mist">
            Crie ofertas de compra com link público (~30% abaixo do mercado).
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
          <h3 className="font-semibold">Nova oferta</h3>
          <input
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
            placeholder="Título da oferta"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
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
            <ul className="text-sm text-luxury-mist">
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
          {createMutation.error && (
            <p className="text-sm text-red-300">{(createMutation.error as Error).message}</p>
          )}
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h3 className="mb-3 font-semibold">Ofertas ativas</h3>
          {isLoading ? (
            <p className="text-sm text-luxury-mist">Carregando…</p>
          ) : (data?.buylists ?? []).length === 0 ? (
            <p className="text-sm text-luxury-mist">Nenhuma oferta ainda.</p>
          ) : (
            <ul className="space-y-3">
              {(data?.buylists ?? []).map((b) => (
                <li key={String(b.id)} className="rounded-lg border border-white/10 p-3 text-sm">
                  <p className="font-medium">{String(b.title)}</p>
                  <p className="text-luxury-mist">
                    {String(b.item_count)} itens · {formatBRL(Number(b.total_offer_cents ?? 0))}
                  </p>
                  <Link
                    href={`/buylist/${String(b.public_token)}`}
                    className="mt-2 inline-block text-luxury-gold underline"
                    target="_blank"
                  >
                    Abrir link público
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </>
  );
}
