"use client";

import type { FulfillmentStatus } from "@/types/seller-fulfillment";
import { FULFILLMENT_STEPS, fulfillmentStepIndex } from "@/types/seller-fulfillment";

type Props = {
  status: FulfillmentStatus | string | null | undefined;
};

export function FulfillmentWorkflowStepper({ status }: Props) {
  const current = (status ?? "Pending") as FulfillmentStatus;
  const activeIdx = fulfillmentStepIndex(current);
  const terminal = ["Cancelled", "Failed", "Lost", "Returned", "Exception"].includes(current);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground">Fluxo de fulfillment</h3>
      {terminal ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          Estado: {current}
        </p>
      ) : (
        <ol className="flex flex-wrap gap-1">
          {FULFILLMENT_STEPS.map((step, idx) => {
            const done = idx < activeIdx;
            const active = idx === activeIdx;
            return (
              <li
                key={step.status}
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : done
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-muted/50 text-muted-foreground"
                }`}
              >
                {step.label}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
