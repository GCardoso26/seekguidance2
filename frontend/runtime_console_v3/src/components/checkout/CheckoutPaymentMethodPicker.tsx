"use client";

import { CreditCard, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  method: "pix" | "stripe";
  pixAvailable: boolean;
  stripeAvailable: boolean;
  onSelectPix: () => void;
  onSelectStripe: () => void;
  className?: string;
};

export function CheckoutPaymentMethodPicker({
  method,
  pixAvailable,
  stripeAvailable,
  onSelectPix,
  onSelectStripe,
  className,
}: Props) {
  return (
    <div className={cn("space-y-3", className)}>
      <h2 className="text-h3 font-semibold">Forma de pagamento</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {pixAvailable && (
          <button
            type="button"
            onClick={onSelectPix}
            className={cn(
              "flex items-start gap-3 rounded-xl border p-4 text-left transition-all",
              method === "pix"
                ? "border-success bg-success/5 shadow-sm ring-1 ring-success/20"
                : "border-border bg-card hover:border-primary/30 hover:shadow-sm",
            )}
            aria-pressed={method === "pix"}
          >
            <span
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                method === "pix" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground",
              )}
            >
              <QrCode className="h-5 w-5" aria-hidden />
            </span>
            <span>
              <span className="block text-small font-semibold">PIX</span>
              <span className="mt-0.5 block text-caption text-success">Confirmação rápida · zero comissão</span>
            </span>
          </button>
        )}
        {stripeAvailable && (
          <button
            type="button"
            onClick={onSelectStripe}
            className={cn(
              "flex items-start gap-3 rounded-xl border p-4 text-left transition-all",
              method === "stripe"
                ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                : "border-border bg-card hover:border-primary/30 hover:shadow-sm",
            )}
            aria-pressed={method === "stripe"}
          >
            <span
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                method === "stripe" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
              )}
            >
              <CreditCard className="h-5 w-5" aria-hidden />
            </span>
            <span>
              <span className="block text-small font-semibold">Cartão</span>
              <span className="mt-0.5 block text-caption text-muted-foreground">Visa, Mastercard via Stripe</span>
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
