"use client";

import { useState } from "react";
import type { FulfillmentCommand } from "@/types/seller-fulfillment";

const BULK_COMMANDS: { command: FulfillmentCommand; label: string }[] = [
  { command: "start_picking", label: "Iniciar separação" },
  { command: "complete_picking", label: "Concluir separação" },
  { command: "start_packing", label: "Iniciar embalagem" },
  { command: "complete_packing", label: "Concluir embalagem" },
  { command: "ready_to_ship", label: "Pronto p/ envio" },
  { command: "generate_label", label: "Gerar etiqueta (Melhor Envio)" },
];

type Props = {
  selectedIds: string[];
  onClear: () => void;
  onDone: () => void;
};

export function OrdersBulkActionBar({ selectedIds, onClear, onDone }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runBulk(command: FulfillmentCommand, carrier?: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/seller/orders/bulk/fulfillment/commands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_ids: selectedIds,
          command,
          carrier,
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { detail?: string };
        throw new Error(String(err.detail ?? "Falha na operação em lote"));
      }
      onDone();
      onClear();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  if (selectedIds.length === 0) return null;

  return (
    <div className="sticky bottom-4 z-20 flex flex-wrap items-center gap-3 rounded-xl border border-primary/40 bg-background/95 p-3 shadow-lg backdrop-blur">
      <span className="text-sm font-medium text-foreground">
        {selectedIds.length}{" "}
        {selectedIds.length > 1 ? "pedidos selecionados" : "pedido selecionado"}
      </span>
      <div className="flex flex-wrap gap-2">
        {BULK_COMMANDS.map((item) => (
          <button
            key={item.command}
            type="button"
            disabled={loading}
            onClick={() =>
              void runBulk(
                item.command,
                item.command === "generate_label" ? "melhor_envio" : undefined,
              )
            }
            className="rounded-lg border border-border px-2.5 py-1 text-xs hover:bg-muted disabled:opacity-50"
          >
            {item.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={onClear}
        className="ml-auto text-xs text-muted-foreground underline"
      >
        Limpar seleção
      </button>
      {error ? <p className="w-full text-xs text-danger">{error}</p> : null}
    </div>
  );
}
