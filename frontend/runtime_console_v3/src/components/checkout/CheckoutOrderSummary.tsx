"use client";

import Image from "next/image";
import { Package, ShieldCheck, Store, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StoreTrustChips } from "@/components/marketplace/StoreTrustChips";
import { formatShopPrice, type ShopCartItem } from "@/lib/marketplace-shop";
import { cn } from "@/lib/utils";

export type CheckoutStoreMeta = {
  store_id: string;
  store_name: string;
  verification_status?: string | null;
  average_rating?: number | null;
  review_count?: number | null;
  pix_available?: boolean;
  stripe_available?: boolean;
};

type Props = {
  items: ShopCartItem[];
  subtotalCents: number;
  discountCents?: number;
  escrowFeeCents?: number;
  /** Cotação oficial selecionada; null = ainda não cotado. Não entra no total cobrado. */
  quotedShippingCents?: number | null;
  shippingQuoteLabel?: string | null;
  savingsCents?: number;
  /** Total cobrado agora (produtos ± cupom ± escrow) — sem frete. */
  totalCents: number;
  storeName?: string;
  stores?: CheckoutStoreMeta[];
  storesCount?: number;
  deliveryDays?: number | null;
  couponCode?: string | null;
  isLoading?: boolean;
  sticky?: boolean;
  className?: string;
};

function SummaryRow({
  label,
  value,
  tone = "default",
  testId,
  hint,
}: {
  label: string;
  value: string;
  tone?: "default" | "discount" | "total" | "muted";
  testId?: string;
  hint?: string;
}) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between gap-3 text-small">
        <span className="text-muted-foreground">{label}</span>
        <span
          data-testid={testId}
          className={cn(
            "font-medium tabular-nums",
            tone === "discount" && "text-success",
            tone === "total" && "font-mono text-lg font-bold text-foreground",
            tone === "muted" && "text-muted-foreground",
            tone === "default" && "text-foreground",
          )}
        >
          {value}
        </span>
      </div>
      {hint && <p className="text-caption text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function CheckoutOrderSummary({
  items,
  subtotalCents,
  discountCents = 0,
  escrowFeeCents = 0,
  quotedShippingCents,
  shippingQuoteLabel,
  savingsCents = 0,
  totalCents,
  storeName,
  stores,
  storesCount,
  deliveryDays,
  couponCode,
  isLoading,
  sticky = true,
  className,
}: Props) {
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const storeById = new Map((stores ?? []).map((s) => [s.store_id, s]));
  const byStore = new Map<string, ShopCartItem[]>();
  for (const item of items) {
    const key = item.store_id || "loja";
    const list = byStore.get(key) ?? [];
    list.push(item);
    byStore.set(key, list);
  }

  const primaryStore = stores?.[0];
  const shippingDisplay =
    quotedShippingCents != null
      ? formatShopPrice(quotedShippingCents)
      : "Frete não calculado — informe o CEP ao lado";

  return (
    <aside
      data-testid="checkout-order-summary"
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-card shadow-lg",
        sticky && "lg:sticky lg:top-20",
        className,
      )}
      aria-label="Resumo do pedido"
    >
      <div className="border-b border-border bg-muted/20 px-5 py-4">
        <h2 className="text-h3 font-semibold text-foreground">Resumo</h2>
        <p className="mt-0.5 text-caption text-muted-foreground">
          {itemCount} {itemCount === 1 ? "item" : "itens"}
        </p>
      </div>

      <div className="space-y-4 p-5">
        {(storeName || primaryStore || storesCount != null || deliveryDays != null) && (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {(storeName || primaryStore?.store_name) && (
                <Badge variant="secondary" className="gap-1">
                  <Store className="h-3 w-3" aria-hidden />
                  {storeName || primaryStore?.store_name}
                </Badge>
              )}
              {storesCount != null && storesCount > 1 && (
                <Badge variant="warning">{storesCount} lojas</Badge>
              )}
              {deliveryDays != null && (
                <Badge variant="outline" className="gap-1">
                  <Truck className="h-3 w-3" aria-hidden />
                  ~{deliveryDays} dia(s)
                </Badge>
              )}
            </div>
            {primaryStore && (
              <StoreTrustChips
                compact
                verificationStatus={primaryStore.verification_status}
                averageRating={primaryStore.average_rating}
                reviewCount={primaryStore.review_count}
                acceptsPix={primaryStore.pix_available}
                acceptsCard={primaryStore.stripe_available}
              />
            )}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        ) : (
          <>
            <ul className="max-h-52 space-y-3 overflow-y-auto">
              {items.length === 0 ? (
                <li className="flex items-center gap-2 text-small text-muted-foreground">
                  <Package className="h-4 w-4 shrink-0" aria-hidden />
                  Itens reservados no checkout
                </li>
              ) : (
                Array.from(byStore.entries()).map(([storeId, storeItems]) => {
                  const meta = storeById.get(storeId);
                  return (
                    <li key={storeId} className="space-y-2 border-b border-border pb-3 last:border-0 last:pb-0">
                      {byStore.size > 1 && (
                        <p className="text-caption font-medium uppercase tracking-wide text-muted-foreground">
                          {meta?.store_name || `Loja ${storeId.slice(0, 8)}`}
                        </p>
                      )}
                      {storeItems.map((item) => (
                        <div key={item.product_id} className="flex gap-3">
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                            {item.image ? (
                              <Image
                                src={item.image}
                                alt=""
                                fill
                                className="object-cover"
                                sizes="48px"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-caption text-muted-foreground">
                                TCG
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-2 text-small font-medium leading-snug">{item.name}</p>
                            <p className="text-caption text-muted-foreground">Qtd: {item.quantity}</p>
                          </div>
                          <span className="shrink-0 text-small font-medium tabular-nums">
                            {formatShopPrice(item.price_cents * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </li>
                  );
                })
              )}
            </ul>

            <div className="space-y-2.5 border-t border-border pt-4">
              <SummaryRow
                label={`Produtos (${itemCount} ${itemCount === 1 ? "item" : "itens"})`}
                value={formatShopPrice(subtotalCents)}
              />
              <SummaryRow
                label={shippingQuoteLabel ? `Frete (${shippingQuoteLabel})` : "Frete cotado"}
                value={shippingDisplay}
                tone={quotedShippingCents != null ? "default" : "muted"}
                testId="checkout-shipping-quote"
                hint="Frete não está incluso no PIX/cartão nesta etapa"
              />
              {discountCents > 0 && (
                <SummaryRow
                  label={couponCode ? `Cupom ${couponCode}` : "Desconto"}
                  value={`−${formatShopPrice(discountCents)}`}
                  tone="discount"
                  testId="discount-amount"
                />
              )}
              {savingsCents > 0 && (
                <SummaryRow
                  label="Economia nesta combinação"
                  value={`−${formatShopPrice(savingsCents)}`}
                  tone="discount"
                  testId="checkout-savings"
                />
              )}
              {escrowFeeCents > 0 && (
                <SummaryRow label="Taxa da compra protegida (3%)" value={formatShopPrice(escrowFeeCents)} />
              )}
            </div>

            <div className="rounded-xl bg-muted/40 px-4 py-3">
              <SummaryRow
                label="Total a pagar agora"
                value={formatShopPrice(totalCents)}
                tone="total"
                hint="Somente produtos (± cupom/escrow)"
              />
            </div>

            <div className="flex items-center gap-2 text-caption text-muted-foreground">
              <ShieldCheck className="h-4 w-4 shrink-0 text-success" aria-hidden />
              <span>Estoque reservado enquanto você finaliza o pagamento</span>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
