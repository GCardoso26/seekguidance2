"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { FulfillmentActions, FulfillmentWorkflowStepper } from "@/components/seller-fulfillment";
import { SaleStatusBadge } from "@/components/seller-dashboard/SaleStatusBadge";
import { OrderActions } from "@/components/store/OrderActions";
import { useFulfillment } from "@/hooks/useFulfillment";
import { formatShopPrice } from "@/lib/marketplace-shop";

type Props = {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
};

export function OrderDetailDrawer({ orderId, open, onOpenChange, onUpdated }: Props) {
  const { data, refetch, isLoading } = useQuery({
    queryKey: ["seller-order", orderId],
    queryFn: async () => {
      const res = await fetch(`/api/seller/orders/${encodeURIComponent(orderId!)}`);
      if (!res.ok) throw new Error("not_found");
      return res.json();
    },
    enabled: Boolean(orderId && open),
  });

  const {
    data: fulfillment,
    executeCommand,
    isExecuting,
    refetch: refetchFulfillment,
  } = useFulfillment(orderId, open);

  const order = data?.order as Record<string, unknown> | undefined;
  const items = Array.isArray(order?.items)
    ? (order.items as Array<{ product_name?: string; quantity?: number; unit_price_cents?: number }>)
    : [];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/50" />
        <Dialog.Content
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-border bg-background shadow-xl outline-none"
            data-testid="order-detail-drawer"
          >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <Dialog.Title className="text-lg font-semibold">
              {orderId ? `Pedido #${orderId.slice(0, 8)}` : "Pedido"}
            </Dialog.Title>
            <Dialog.Close className="rounded-lg p-1 hover:bg-muted" aria-label="Fechar">
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
            {order && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <SaleStatusBadge status={String(order.status)} />
                  {order.payment_method ? (
                    <span className="text-xs uppercase text-muted-foreground">
                      {String(order.payment_method)}
                    </span>
                  ) : null}
                  <span className="font-semibold text-primary">
                    {formatShopPrice(Number(order.total_cents ?? 0))}
                  </span>
                </div>

                {Boolean(order.tracking_code || fulfillment?.shipment_tracking_code) && (
                  <p className="text-sm text-muted-foreground">
                    Rastreio:{" "}
                    {String(fulfillment?.shipment_tracking_code ?? order.tracking_code)}
                    {fulfillment?.carrier ? ` (${fulfillment.carrier})` : null}
                  </p>
                )}

                {fulfillment?.label_url && (
                  <a
                    href={fulfillment.label_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary underline"
                  >
                    Baixar etiqueta
                  </a>
                )}

                {fulfillment && (
                  <>
                    <FulfillmentWorkflowStepper status={fulfillment.fulfillment_status} />
                    <FulfillmentActions
                      status={fulfillment.fulfillment_status}
                      disabled={isExecuting}
                      onCommand={async (body) => {
                        await executeCommand(body);
                        await refetch();
                        await refetchFulfillment();
                        onUpdated?.();
                      }}
                    />
                  </>
                )}

                <div>
                  <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Itens</h3>
                  <ul className="space-y-1 text-sm">
                    {items.map((item, idx) => (
                      <li key={idx} className="flex justify-between gap-2">
                        <span>
                          {item.quantity ?? 1}x {item.product_name ?? "Item"}
                        </span>
                        <span className="tabular-nums">
                          {formatShopPrice(
                            (item.unit_price_cents ?? 0) * (item.quantity ?? 1),
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {!fulfillment && (
                  <OrderActions
                    orderId={String(order.id)}
                    status={String(order.status)}
                    paymentMethod={order.payment_method as string | undefined}
                    pixTxid={order.pix_txid as string | undefined}
                    onUpdated={() => {
                      void refetch();
                      onUpdated?.();
                    }}
                  />
                )}
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
