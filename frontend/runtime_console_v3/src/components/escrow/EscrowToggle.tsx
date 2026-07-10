"use client";

import { Shield } from "lucide-react";
import { EscrowFeeCalculator } from "@/components/escrow/EscrowFeeCalculator";
import { cn } from "@/lib/utils";

interface EscrowToggleProps {
  enabled: boolean;
  onChange: (value: boolean) => void;
  amountCents: number;
  available: boolean;
  className?: string;
}

export function EscrowToggle({
  enabled,
  onChange,
  amountCents,
  available,
  className,
}: EscrowToggleProps) {
  if (!available) return null;

  return (
    <div className={cn("space-y-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4", className)}>
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-border accent-emerald-500"
        />
        <span className="flex-1">
          <span className="flex items-center gap-2 font-medium text-foreground">
            <Shield className="h-4 w-4 text-emerald-400" />
            Compra Protegida
          </span>
          <span className="mt-1 block text-sm text-muted-foreground">
            Pagamento retido até você confirmar o recebimento. Taxa de 3% sobre o subtotal.
          </span>
        </span>
      </label>
      {enabled && <EscrowFeeCalculator amountCents={amountCents} />}
    </div>
  );
}
