"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useDeckShopPlan } from "@/hooks/useBuyerExperience";
import { formatShopPrice } from "@/lib/marketplace-shop";
import { addProductToCart } from "@/lib/marketplace-shop";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import { showToast } from "@/lib/toast";
import { useQueryClient } from "@tanstack/react-query";

type Props = {
  deckId: string;
  deckName?: string;
};

export function DeckShoppingPanel({ deckId, deckName }: Props) {
  const [mode, setMode] = useState<"missing" | "all">("missing");
  const { data, isLoading } = useDeckShopPlan(deckId, mode);
  const qc = useQueryClient();

  const missingCount = useMemo(
    () => (data?.to_buy ?? []).filter((l) => Number(l.buy_qty ?? l.missing ?? 0) > 0).length,
    [data],
  );

  async function addAllAvailable() {
    const lines = data?.to_buy ?? [];
    let added = 0;
    for (const line of lines) {
      const pid = line.product_id ? String(line.product_id) : "";
      const qty = Number(line.buy_qty ?? 1);
      if (!pid || qty <= 0) continue;
      const result = await addProductToCart(pid, qty);
      if (result.ok) added += 1;
    }
    await qc.invalidateQueries({ queryKey: ["shop-cart"] });
    void trackEvent("deck_shop_open", { deck_id: deckId, mode, added });
    showToast(
      added > 0 ? `${added} item(ns) adicionados ao carrinho` : "Nenhuma oferta disponível no momento",
      added > 0 ? "success" : "error",
    );
  }

  return (
    <section
      className="mt-6 surface-card p-4"
      data-testid="deck-shopping-panel"
      aria-label="Comprar deck"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Deck Shopping</h2>
          <p className="text-xs text-muted-foreground">
            {deckName ?? "Deck"} — cartas possuídas, faltantes e melhor combinação de lojas.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={mode === "missing" ? "default" : "outline"}
            onClick={() => setMode("missing")}
          >
            Só faltantes
          </Button>
          <Button
            size="sm"
            variant={mode === "all" ? "default" : "outline"}
            onClick={() => setMode("all")}
          >
            Todas
          </Button>
        </div>
      </div>

      {isLoading && <p className="mt-3 text-sm text-muted-foreground">Calculando…</p>}

      {data && (
        <>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg border border-white/5 p-3">
              <p className="text-xs text-muted-foreground">Possuídas</p>
              <p className="text-lg font-semibold">
                {(data.owned ?? []).filter((o) => Number(o.owned) >= Number(o.needed)).length}
              </p>
            </div>
            <div className="rounded-lg border border-white/5 p-3">
              <p className="text-xs text-muted-foreground">A comprar</p>
              <p className="text-lg font-semibold">{missingCount}</p>
            </div>
            <div className="rounded-lg border border-white/5 p-3">
              <p className="text-xs text-muted-foreground">Valor estimado</p>
              <p className="text-lg font-semibold text-primary">
                {formatShopPrice(data.estimated_value_cents)}
              </p>
            </div>
          </div>

          {(data.best_store_combination ?? []).length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium">Melhor combinação de lojas</h3>
              <ul className="mt-2 space-y-2">
                {data.best_store_combination.map((s) => (
                  <li
                    key={s.store_id}
                    className="flex items-center justify-between rounded-lg border border-white/5 px-3 py-2 text-sm"
                  >
                    <span>
                      {s.store_slug ? (
                        <Link href={`/marketplace/loja/${s.store_slug}`} className="hover:text-primary">
                          {s.store_name ?? s.store_id}
                        </Link>
                      ) : (
                        s.store_name ?? s.store_id
                      )}
                      <span className="ml-2 text-xs text-muted-foreground">Trust {Math.round(s.trust_score)}</span>
                    </span>
                    <span>{formatShopPrice(s.subtotal_cents)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" onClick={() => void addAllAvailable()} disabled={missingCount === 0}>
              Adicionar ao carrinho
            </Button>
            <Button asChild variant="outline">
              <Link href="/carrinho">Ver carrinho</Link>
            </Button>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">{data.policy}</p>
        </>
      )}
    </section>
  );
}
