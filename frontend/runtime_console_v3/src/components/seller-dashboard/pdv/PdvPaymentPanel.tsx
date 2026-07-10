"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatShopPrice } from "@/lib/marketplace-shop";
import { cartTotalCents } from "@/lib/pdv-sale-form";
import type { PdvCartItem, PdvPaymentMethod, PdvSaleRecord } from "@/types/pdv";

const PdvPixPayment = dynamic(
  () => import("@/components/seller-dashboard/pdv/PdvPixPayment").then((m) => m.PdvPixPayment),
  { ssr: false },
);

type Tab = PdvPaymentMethod;

type Props = {
  storeId: string;
  storeName: string;
  items: PdvCartItem[];
  onComplete: (method: PdvPaymentMethod, notes?: string) => Promise<void>;
  onPixComplete?: (sale: PdvSaleRecord) => Promise<void>;
  isPending?: boolean;
  onCancel?: () => void;
};

export function PdvPaymentPanel({
  storeId,
  storeName,
  items,
  onComplete,
  onPixComplete,
  isPending,
  onCancel,
}: Props) {
  const [tab, setTab] = useState<Tab>("cash");
  const [cardNotes, setCardNotes] = useState("");
  const [cardAmount, setCardAmount] = useState("");
  const total = cartTotalCents(items);

  const tabs: { id: Tab; label: string }[] = [
    { id: "cash", label: "Dinheiro" },
    { id: "pix", label: "PIX" },
    { id: "card", label: "Cartão" },
  ];

  return (
    <div className="surface-card p-4" data-testid="pdv-payment-panel">
      <div className="mb-3 flex gap-1 rounded-lg bg-foreground/30 p-1" data-testid="pdv-payment-tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition ${
              tab === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/80"
            }`}
            data-testid={`pdv-payment-tab-${t.id}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <p className="mb-3 text-sm text-muted-foreground">
        Total a receber: <strong className="text-foreground">{formatShopPrice(total)}</strong>
      </p>

      {tab === "cash" && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Registre a venda em dinheiro após receber o valor.</p>
          <Button
            type="button"
            className="w-full"
            disabled={isPending}
            onClick={() => void onComplete("cash")}
            data-testid="pdv-confirm-cash"
          >
            {isPending ? "Registrando…" : "Confirmar venda em dinheiro"}
          </Button>
        </div>
      )}

      {tab === "pix" && (
        <PdvPixPayment
          storeId={storeId}
          storeName={storeName}
          items={items}
          isPending={isPending}
          onComplete={async (sale) => {
            if (onPixComplete) {
              await onPixComplete(sale);
            } else {
              await onComplete("pix");
            }
          }}
        />
      )}

      {tab === "card" && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Cobre na maquininha externa e registre a venda aqui (sem integração TEF).
          </p>
          <label className="block text-xs text-muted-foreground">
            Valor aprovado (opcional)
            <Input
              type="number"
              step="0.01"
              min="0"
              value={cardAmount}
              onChange={(e) => setCardAmount(e.target.value)}
              className="mt-1 border-border bg-foreground/30"
              placeholder={String((total / 100).toFixed(2))}
              data-testid="pdv-card-amount"
            />
          </label>
          <Input
            value={cardNotes}
            onChange={(e) => setCardNotes(e.target.value)}
            placeholder="NSU / bandeira (opcional)"
            className="border-border bg-foreground/30"
            data-testid="pdv-card-notes"
          />
          <Button
            type="button"
            className="w-full"
            disabled={isPending}
            onClick={() => {
              const notes = [
                cardNotes.trim(),
                cardAmount ? `Valor maquininha: R$ ${cardAmount}` : "",
              ]
                .filter(Boolean)
                .join(" · ");
              void onComplete("card", notes || undefined);
            }}
            data-testid="pdv-confirm-card"
          >
            {isPending ? "Registrando…" : "Registrar cartão aprovado"}
          </Button>
        </div>
      )}

      {onCancel && (
        <Button type="button" variant="ghost" className="mt-3 w-full text-sm" onClick={onCancel}>
          Voltar ao carrinho
        </Button>
      )}
    </div>
  );
}
