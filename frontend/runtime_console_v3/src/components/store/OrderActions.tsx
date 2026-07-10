"use client";

import { useState } from "react";

type Props = {
  orderId: string;
  status: string;
  paymentMethod?: string;
  pixTxid?: string;
  onUpdated: () => void;
};

export function OrderActions({ orderId, status, paymentMethod, pixTxid, onUpdated }: Props) {
  const [tracking, setTracking] = useState("");
  const [loading, setLoading] = useState(false);

  async function confirmPix() {
    if (!pixTxid) return;
    setLoading(true);
    try {
      const res = await fetch("/api/marketplace/shop/pix/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txid: pixTxid }),
      });
      if (!res.ok) throw new Error("Falha ao confirmar PIX");
      onUpdated();
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(next: string, trackingCode?: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/marketplace/shop/orders/${encodeURIComponent(orderId)}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next, tracking_code: trackingCode || undefined }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(String(err.detail ?? "Falha ao atualizar"));
      }
      onUpdated();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {status === "pending" && paymentMethod === "pix" && (
        <button
          type="button"
          disabled={loading}
          onClick={() => void confirmPix()}
          className="rounded-lg border border-emerald-500/40 px-3 py-1 text-xs text-emerald-300"
        >
          Confirmar PIX
        </button>
      )}
      {status === "paid" && (
        <button
          type="button"
          disabled={loading}
          onClick={() => void updateStatus("processing")}
          className="rounded-lg border border-border px-3 py-1 text-xs"
        >
          Em preparação
        </button>
      )}
      {(status === "paid" || status === "processing") && (
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            placeholder="Código de rastreio"
            className="rounded border border-border bg-card shadow-card px-2 py-1 text-xs"
          />
          <button
            type="button"
            disabled={loading}
            onClick={() => void updateStatus("shipped", tracking)}
            className="rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground"
          >
            Marcar enviado
          </button>
        </div>
      )}
      {status === "shipped" && (
        <button
          type="button"
          disabled={loading}
          onClick={() => void updateStatus("delivered")}
          className="rounded-lg border border-border px-3 py-1 text-xs"
        >
          Marcar entregue
        </button>
      )}
    </div>
  );
}
