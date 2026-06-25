"use client";

import { calculateEscrowFees } from "@/lib/escrow/escrow-service";
import { formatCurrency } from "@/lib/format-currency";

interface EscrowFeeCalculatorProps {
  amountCents: number;
  shippingCents?: number;
}

export function EscrowFeeCalculator({ amountCents, shippingCents = 0 }: EscrowFeeCalculatorProps) {
  const fees = calculateEscrowFees(amountCents, shippingCents);

  return (
    <dl className="space-y-2 rounded-lg border border-white/10 bg-luxury-onyx/50 p-4 text-sm">
      <div className="flex justify-between">
        <dt className="text-luxury-mist">Subtotal</dt>
        <dd>{formatCurrency(fees.amountCents / 100, "BRL")}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-luxury-mist">Frete</dt>
        <dd>{formatCurrency(fees.shippingCents / 100, "BRL")}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-luxury-mist">Taxa Compra Protegida (3%)</dt>
        <dd>{formatCurrency(fees.escrowFeeCents / 100, "BRL")}</dd>
      </div>
      <div className="flex justify-between border-t border-white/10 pt-2 font-semibold">
        <dt>Total</dt>
        <dd className="text-emerald-400">{formatCurrency(fees.totalCents / 100, "BRL")}</dd>
      </div>
    </dl>
  );
}
