"use client";

import { CheckCircle2, Circle, Package, Shield, Truck } from "lucide-react";
import type { EscrowStatus } from "@/lib/escrow/types";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "payment", label: "Pagamento", icon: Shield, statuses: ["pending_payment", "payment_received"] as EscrowStatus[] },
  { key: "ship", label: "Envio", icon: Truck, statuses: ["shipped"] as EscrowStatus[] },
  { key: "delivery", label: "Entrega", icon: Package, statuses: ["delivered"] as EscrowStatus[] },
  { key: "release", label: "Liberação", icon: CheckCircle2, statuses: ["released_to_seller", "resolved"] as EscrowStatus[] },
] as const;

function stepIndex(status: EscrowStatus): number {
  if (["released_to_seller", "refunded_to_buyer"].includes(status)) return 4;
  if (status === "delivered" || status === "disputed" || status === "resolved") return 3;
  if (status === "shipped") return 2;
  if (status === "payment_received") return 1;
  return 0;
}

interface EscrowTimelineProps {
  status: EscrowStatus;
  className?: string;
}

export function EscrowTimeline({ status, className }: EscrowTimelineProps) {
  const current = stepIndex(status);

  return (
    <ol className={cn("flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", className)}>
      {STEPS.map((step, index) => {
        const done = current > index + 1 || (current === index + 1 && status !== "pending_payment");
        const active = current === index + 1;
        const Icon = step.icon;
        return (
          <li key={step.key} className="flex items-center gap-2 text-sm">
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border",
                done && "border-emerald-500/50 bg-emerald-500/10 text-emerald-400",
                active && !done && "border-luxury-gold/50 bg-luxury-gold/10 text-luxury-gold",
                !done && !active && "border-white/10 text-luxury-mist",
              )}
            >
              {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
            </span>
            <span className={cn(active ? "font-medium text-luxury-frost" : "text-luxury-mist")}>
              {step.label}
            </span>
            {index < STEPS.length - 1 && (
              <Circle className="hidden h-1 w-1 fill-luxury-mist text-luxury-mist sm:mx-2 sm:block" aria-hidden />
            )}
          </li>
        );
      })}
    </ol>
  );
}
