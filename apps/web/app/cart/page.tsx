"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Protected } from "@/src/components/Protected";
import { useCart } from "@/src/cart/cart-provider";
import { formatPriceCents } from "@/src/lib/format";
import { Button, Card, EmptyState, ErrorState, Loading } from "@/src/components/ui";

function CartBody() {
  const router = useRouter();
  const { cart, displayMeta, loading, error, removeItem, setQuantity, startCheckout } =
    useCart();
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  if (loading && !cart) return <Loading label="Carregando carrinho…" />;

  if (!cart || cart.items.length === 0) {
    return (
      <EmptyState
        title="Carrinho vazio"
        description="Adicione uma oferta a partir da página da carta."
      />
    );
  }

  async function onCheckout() {
    setCheckoutError(null);
    setStarting(true);
    try {
      const session = await startCheckout();
      router.push(`/checkout?session=${encodeURIComponent(session.checkoutSessionId)}`);
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : "checkout_failed");
    } finally {
      setStarting(false);
    }
  }

  return (
    <div className="space-y-6" data-testid="cart-page">
      <ul className="space-y-4">
        {cart.items.map((item) => {
          const meta = displayMeta[item.listingId];
          return (
            <li
              key={item.id}
              className="border-b border-zinc-200 pb-4"
              data-testid="cart-item"
            >
              <h2 className="text-base font-semibold text-zinc-900">
                {meta?.cardName ?? "Carta"}
              </h2>
              <dl className="mt-2 grid gap-1 text-sm text-zinc-700">
                <div>
                  <dt className="inline font-medium text-zinc-900">Loja: </dt>
                  <dd className="inline">{meta?.storeName ?? "—"}</dd>
                </div>
                <div>
                  <dt className="inline font-medium text-zinc-900">Condição: </dt>
                  <dd className="inline">{meta?.condition ?? "—"}</dd>
                </div>
                <div>
                  <dt className="inline font-medium text-zinc-900">Idioma: </dt>
                  <dd className="inline uppercase">{meta?.language ?? "—"}</dd>
                </div>
                <div>
                  <dt className="inline font-medium text-zinc-900">Preço: </dt>
                  <dd className="inline">
                    {formatPriceCents(item.priceSnapshotCents, item.currency)}
                  </dd>
                </div>
              </dl>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-zinc-800">
                  Quantidade
                  <input
                    type="number"
                    min={1}
                    className="w-16 rounded border border-zinc-300 px-2 py-1"
                    value={item.quantity}
                    disabled={loading}
                    aria-label={`Quantidade ${meta?.cardName ?? "item"}`}
                    onChange={(e) => {
                      const q = Number(e.target.value);
                      if (!Number.isFinite(q)) return;
                      void setQuantity(item.id, item.listingId, q);
                    }}
                  />
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={loading}
                  onClick={() => {
                    void removeItem(item.id);
                  }}
                >
                  Remover
                </Button>
              </div>
              {/* Never render listingId / catalogVariantId in UI */}
            </li>
          );
        })}
      </ul>

      <p className="text-lg font-semibold text-zinc-900">
        Total: {formatPriceCents(cart.totalCents, cart.currency)}
      </p>

      {error ? <ErrorState title="Erro no carrinho" description={error} /> : null}
      {checkoutError ? (
        <ErrorState title="Não foi possível iniciar o checkout" description={checkoutError} />
      ) : null}

      <Button type="button" disabled={starting || loading} onClick={() => void onCheckout()}>
        {starting ? "Iniciando…" : "Continuar compra"}
      </Button>
    </div>
  );
}

export default function CartPage() {
  return (
    <Protected>
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-zinc-900">Carrinho</h1>
          <Link href="/search" className="text-sm text-emerald-800 underline">
            Continuar buscando
          </Link>
        </div>
        <CartBody />
      </Card>
    </Protected>
  );
}
