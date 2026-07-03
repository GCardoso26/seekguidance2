"use client";

import { useState } from "react";
import type { FulfillmentCommand, FulfillmentStatus } from "@/types/seller-fulfillment";
import { nextFulfillmentCommand } from "@/types/seller-fulfillment";

const COMMAND_LABELS: Record<FulfillmentCommand, string> = {
  start_picking: "Iniciar separação",
  complete_picking: "Concluir separação",
  start_packing: "Iniciar embalagem",
  complete_packing: "Concluir embalagem",
  ready_to_ship: "Marcar pronto p/ envio",
  generate_label: "Gerar etiqueta",
  confirm_ship: "Confirmar envio",
  confirm_delivery: "Confirmar entrega",
  complete: "Concluir fulfillment",
  cancel: "Cancelar",
};

type Props = {
  status: FulfillmentStatus | string;
  onCommand: (body: {
    command: FulfillmentCommand;
    carrier?: string;
    tracking_code?: string;
  }) => Promise<void>;
  disabled?: boolean;
};

export function FulfillmentActions({ status, onCommand, disabled }: Props) {
  const [tracking, setTracking] = useState("");
  const [carrier, setCarrier] = useState("");
  const [loading, setLoading] = useState(false);

  const next = nextFulfillmentCommand(status as FulfillmentStatus);
  const canGenerateLabel = status === "Packed" || status === "ReadyToShip";

  async function run(command: FulfillmentCommand, carrierOverride?: string) {
    setLoading(true);
    try {
      await onCommand({
        command,
        carrier: carrierOverride || carrier || undefined,
        tracking_code: command === "confirm_ship" ? tracking || undefined : undefined,
      });
    } finally {
      setLoading(false);
    }
  }

  if (!next && !canGenerateLabel) return null;

  return (
    <div className="space-y-2 border-t border-white/10 pt-4">
      <h3 className="text-sm font-semibold text-luxury-mist">Ações operacionais</h3>
      <div className="flex flex-wrap gap-2">
        {next && next !== "confirm_ship" && (
          <button
            type="button"
            disabled={disabled || loading}
            onClick={() => void run(next)}
            className="rounded-lg bg-luxury-gold px-3 py-1.5 text-xs font-semibold text-luxury-onyx"
          >
            {COMMAND_LABELS[next]}
          </button>
        )}
        {canGenerateLabel && (
          <button
            type="button"
            disabled={disabled || loading}
            onClick={() => void run("generate_label", "melhor_envio")}
            className="rounded-lg border border-white/20 px-3 py-1.5 text-xs"
          >
            Gerar etiqueta Melhor Envio
          </button>
        )}
        {(next === "confirm_ship" || status === "ReadyToShip") && (
          <div className="flex w-full flex-wrap items-center gap-2">
            <input
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              placeholder="Transportadora"
              className="rounded border border-white/10 bg-white/5 px-2 py-1 text-xs"
            />
            <input
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              placeholder="Código de rastreio"
              className="min-w-[140px] flex-1 rounded border border-white/10 bg-white/5 px-2 py-1 text-xs"
            />
            <button
              type="button"
              disabled={disabled || loading || !tracking.trim()}
              onClick={() => void run("confirm_ship")}
              className="rounded-lg bg-luxury-gold px-3 py-1.5 text-xs font-semibold text-luxury-onyx"
            >
              {COMMAND_LABELS.confirm_ship}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
