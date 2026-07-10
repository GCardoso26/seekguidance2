"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { formatShopPrice } from "@/lib/marketplace-shop";
import type { PdvCartItem, PdvPaymentMethod, PdvSaleRecord } from "@/types/pdv";

type Props = {
  open: boolean;
  sale: PdvSaleRecord | null;
  items: PdvCartItem[];
  paymentMethod: PdvPaymentMethod;
  storeName: string;
  onClose: () => void;
};

function paymentLabel(method: PdvPaymentMethod) {
  if (method === "cash") return "Dinheiro";
  if (method === "pix") return "PIX";
  return "Cartão";
}

export function PdvReceiptPrint({ open, sale, items, paymentMethod, storeName, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.title;
    document.title = `Cupom PDV ${sale?.id?.slice(0, 8) ?? ""}`;
    return () => {
      document.title = prev;
    };
  }, [open, sale?.id]);

  if (!open || !sale) return null;

  const total = Number(sale.total_cents ?? 0);
  const saleId = String(sale.id ?? "—");
  const createdAt = sale.created_at ? new Date(sale.created_at) : new Date();

  function handlePrint() {
    window.print();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 p-4 print:relative print:inset-auto print:bg-transparent print:p-0"
      role="dialog"
      aria-modal
      data-testid="pdv-receipt-modal"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-background p-6 shadow-xl print:max-h-none print:max-w-none print:overflow-visible print:border-0 print:p-0 print:shadow-none">
        <div className="mb-4 flex items-center justify-between print:hidden">
          <h3 className="text-lg font-semibold">Cupom de venda</h3>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Fechar
          </Button>
        </div>

        <div ref={printRef} className="pdv-receipt-print mx-auto bg-white text-black print:block">
          <style>{`
            @media print {
              @page { size: 80mm auto; margin: 4mm; }
              body * { visibility: hidden; }
              .pdv-receipt-print, .pdv-receipt-print * { visibility: visible; }
              .pdv-receipt-print {
                position: absolute;
                left: 0;
                top: 0;
                width: 72mm;
                font-family: monospace;
                font-size: 11px;
                line-height: 1.35;
                padding: 0;
              }
            }
            .pdv-receipt-print {
              width: 72mm;
              max-width: 100%;
              padding: 12px;
              font-family: ui-monospace, monospace;
              font-size: 12px;
              line-height: 1.4;
            }
          `}</style>

          <p className="text-center text-sm font-bold">{storeName}</p>
          <p className="text-center text-caption">Comprovante não fiscal</p>
          <p className="mt-2 text-center text-caption">
            {createdAt.toLocaleString("pt-BR")}
          </p>
          <p className="text-center text-caption">Pedido: {saleId.slice(0, 12)}</p>
          <hr className="my-2 border-dashed border-black/30" />

          {items.map((item) => (
            <div key={item.product_id} className="mb-1">
              <p className="truncate font-semibold">{item.name}</p>
              <p className="flex justify-between text-caption">
                <span>
                  {item.quantity} × {formatShopPrice(item.price_cents)}
                </span>
                <span>{formatShopPrice(item.price_cents * item.quantity)}</span>
              </p>
            </div>
          ))}

          <hr className="my-2 border-dashed border-black/30" />
          <p className="flex justify-between font-bold">
            <span>TOTAL</span>
            <span>{formatShopPrice(total)}</span>
          </p>
          <p className="mt-1 text-caption">Pagamento: {paymentLabel(paymentMethod)}</p>
          <p className="mt-4 text-center text-overline">Obrigado pela preferência!</p>
        </div>

        <div className="mt-4 flex gap-2 print:hidden">
          <Button type="button" className="flex-1" onClick={handlePrint} data-testid="pdv-print-btn">
            Imprimir
          </Button>
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Concluir
          </Button>
        </div>
      </div>
    </div>
  );
}
