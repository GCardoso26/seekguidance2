"use client";

import { CreditCard, QrCode, Store } from "lucide-react";
import { cn } from "@/lib/utils";

export type CheckoutPayMethod = "pix" | "stripe" | "counter";

type Props = {
  method: CheckoutPayMethod;
  pixAvailable: boolean;
  stripeAvailable: boolean;
  counterAvailable?: boolean;
  onSelectPix: () => void;
  onSelectStripe: () => void;
  onSelectCounter?: () => void;
  className?: string;
};

export function CheckoutPaymentMethodPicker({
  method,
  pixAvailable,
  stripeAvailable,
  counterAvailable = false,
  onSelectPix,
  onSelectStripe,
  onSelectCounter,
  className,
}: Props) {
  const anyOnline = pixAvailable || stripeAvailable;
  const anyMethod = anyOnline || counterAvailable;

  return (
    <div className={cn("space-y-3", className)} data-testid="checkout-payment-picker">
      <h2 className="text-h3 font-semibold">Forma de pagamento</h2>
      {counterAvailable && (
        <div className="grid gap-3 sm:grid-cols-2" data-testid="checkout-fulfillment-mode">
          <button
            type="button"
            onClick={() => onSelectPix()}
            className={cn(
              "rounded-xl border p-3 text-left text-small transition-all",
              method !== "counter"
                ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                : "border-border bg-card hover:border-primary/30",
            )}
          >
            <span className="block font-semibold">Pagar no site</span>
            <span className="mt-0.5 block text-caption text-muted-foreground">
              PIX ou cartão online
            </span>
          </button>
          <button
            type="button"
            onClick={() => onSelectCounter?.()}
            className={cn(
              "rounded-xl border p-3 text-left text-small transition-all",
              method === "counter"
                ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                : "border-border bg-card hover:border-primary/30",
            )}
            data-testid="checkout-counter-option"
          >
            <span className="block font-semibold">Pagar no balcão</span>
            <span className="mt-0.5 block text-caption text-muted-foreground">
              Vaga reservada por 24h
            </span>
          </button>
        </div>
      )}

      {method !== "counter" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => pixAvailable && onSelectPix()}
            disabled={!pixAvailable}
            className={cn(
              "flex items-start gap-3 rounded-xl border p-4 text-left transition-all",
              !pixAvailable && "cursor-not-allowed opacity-55",
              pixAvailable && method === "pix"
                ? "border-success bg-success/5 shadow-sm ring-1 ring-success/20"
                : pixAvailable
                  ? "border-border bg-card hover:border-primary/30 hover:shadow-sm"
                  : "border-border bg-muted/40",
            )}
            aria-pressed={method === "pix"}
            aria-disabled={!pixAvailable}
          >
            <span
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                pixAvailable && method === "pix"
                  ? "bg-success/15 text-success"
                  : "bg-muted text-muted-foreground",
              )}
            >
              <QrCode className="h-5 w-5" aria-hidden />
            </span>
            <span>
              <span className="block text-small font-semibold">PIX</span>
              <span
                className={cn(
                  "mt-0.5 block text-caption",
                  pixAvailable ? "text-success" : "text-muted-foreground",
                )}
              >
                {pixAvailable ? "Confirmação rápida" : "Indisponível para as lojas deste carrinho"}
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => stripeAvailable && onSelectStripe()}
            disabled={!stripeAvailable}
            className={cn(
              "flex items-start gap-3 rounded-xl border p-4 text-left transition-all",
              !stripeAvailable && "cursor-not-allowed opacity-55",
              stripeAvailable && method === "stripe"
                ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                : stripeAvailable
                  ? "border-border bg-card hover:border-primary/30 hover:shadow-sm"
                  : "border-border bg-muted/40",
            )}
            aria-pressed={method === "stripe"}
            aria-disabled={!stripeAvailable}
          >
            <span
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                stripeAvailable && method === "stripe"
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground",
              )}
            >
              <CreditCard className="h-5 w-5" aria-hidden />
            </span>
            <span>
              <span className="block text-small font-semibold">Cartão</span>
              <span className="mt-0.5 block text-caption text-muted-foreground">
                {stripeAvailable ? "Visa, Mastercard" : "Indisponível para as lojas deste carrinho"}
              </span>
            </span>
          </button>
        </div>
      )}

      {method === "counter" && (
        <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Store className="h-5 w-5" aria-hidden />
          </span>
          <span>
            <span className="block text-small font-semibold">Pagamento na loja</span>
            <span className="mt-0.5 block text-caption text-muted-foreground">
              Sua vaga fica reservada por 24 horas. A loja confirma o pagamento no balcão.
            </span>
          </span>
        </div>
      )}

      {!anyMethod && (
        <p className="text-small text-danger" role="alert">
          Nenhuma forma de pagamento disponível para as lojas deste carrinho.
        </p>
      )}
    </div>
  );
}
