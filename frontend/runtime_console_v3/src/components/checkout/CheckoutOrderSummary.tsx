import { formatShopPrice, type ShopCartItem } from "@/lib/marketplace-shop";
import { cn } from "@/lib/utils";

type Props = {
  items: ShopCartItem[];
  subtotalCents: number;
  discountCents?: number;
  escrowFeeCents?: number;
  shippingCents?: number;
  savingsCents?: number;
  totalCents: number;
  storeName?: string;
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
  tone,
  testId,
}: {
  label: string;
  value: string;
  tone?: "default" | "discount" | "total";
  testId?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-luxury-mist">{label}</span>
      <span
        data-testid={testId}
        className={cn(
          "font-medium tabular-nums",
          tone === "discount" && "text-emerald-400",
          tone === "total" && "text-lg font-bold text-luxury-frost",
          tone === "default" && "text-white",
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function CheckoutOrderSummary({
  items,
  subtotalCents,
  discountCents = 0,
  escrowFeeCents = 0,
  shippingCents,
  savingsCents = 0,
  totalCents,
  storeName,
  storesCount,
  deliveryDays,
  couponCode,
  isLoading,
  sticky = true,
  className,
}: Props) {
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const byStore = new Map<string, ShopCartItem[]>();
  for (const item of items) {
    const key = item.store_id || "loja";
    const list = byStore.get(key) ?? [];
    list.push(item);
    byStore.set(key, list);
  }

  return (
    <aside
      data-testid="checkout-order-summary"
      className={cn(
        "rounded-xl border border-white/10 bg-white/5 p-4",
        sticky && "lg:sticky lg:top-4",
        className,
      )}
      aria-label="Resumo do pedido"
    >
      <h2 className="text-sm font-semibold uppercase tracking-wide text-luxury-mist">
        Resumo do pedido
      </h2>

      {storeName && <p className="mt-1 text-xs text-luxury-mist/80">Loja: {storeName}</p>}
      {storesCount != null && storesCount > 1 && (
        <p className="mt-1 text-xs text-amber-400">{storesCount} lojas — envios separados</p>
      )}
      {deliveryDays != null && (
        <p className="mt-1 text-xs text-luxury-mist">Prazo estimado ~{deliveryDays} dia(s)</p>
      )}

      {isLoading ? (
        <div className="mt-4 space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-white/5" />
          ))}
        </div>
      ) : (
        <>
          <ul className="mt-4 max-h-56 space-y-3 overflow-y-auto text-sm">
            {items.length === 0 ? (
              <li className="text-luxury-mist">Itens reservados no checkout</li>
            ) : (
              Array.from(byStore.entries()).map(([storeId, storeItems]) => (
                <li key={storeId} className="space-y-1 border-b border-white/5 pb-2 last:border-0">
                  <p className="text-[10px] uppercase tracking-wide text-luxury-mist">
                    Loja {storeId.slice(0, 8)}
                  </p>
                  {storeItems.map((item) => (
                    <div key={item.product_id} className="flex justify-between gap-2">
                      <span className="line-clamp-2 text-luxury-frost">
                        {item.quantity}× {item.name}
                      </span>
                      <span className="shrink-0 tabular-nums text-luxury-mist">
                        {formatShopPrice(item.price_cents * item.quantity)}
                      </span>
                    </div>
                  ))}
                </li>
              ))
            )}
          </ul>

          <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
            <SummaryRow
              label={`Subtotal (${itemCount} ${itemCount === 1 ? "item" : "itens"})`}
              value={formatShopPrice(subtotalCents)}
            />
            {shippingCents != null && (
              <SummaryRow label="Frete" value={formatShopPrice(shippingCents)} />
            )}
            {discountCents > 0 && (
              <SummaryRow
                label={couponCode ? `Desconto (${couponCode})` : "Desconto"}
                value={`−${formatShopPrice(discountCents)}`}
                tone="discount"
                testId="discount-amount"
              />
            )}
            {savingsCents > 0 && (
              <SummaryRow
                label="Economia estimada"
                value={`−${formatShopPrice(savingsCents)}`}
                tone="discount"
                testId="checkout-savings"
              />
            )}
            {escrowFeeCents > 0 && (
              <SummaryRow label="Taxa escrow (3%)" value={formatShopPrice(escrowFeeCents)} />
            )}
            <SummaryRow label="Total" value={formatShopPrice(totalCents)} tone="total" />
          </div>
        </>
      )}
    </aside>
  );
}
