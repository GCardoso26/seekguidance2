"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

interface DisputeFormProps {
  escrowId: string;
  onSuccess?: () => void;
}

export function DisputeForm({ escrowId, onSuccess }: DisputeFormProps) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (reason.trim().length < 10) {
      setError("Descreva o problema com pelo menos 10 caracteres.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/marketplace/shop/escrow/${escrowId}/dispute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(String(body.detail ?? "Não foi possível abrir disputa"));
      }
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao abrir disputa");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-red-500/20 bg-red-500/5 p-4">
      <h3 className="font-medium text-danger">Abrir disputa</h3>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={4}
        placeholder="Descreva o problema (produto diferente, não recebido, danificado…)"
        className="w-full rounded-lg border border-border bg-background p-3 text-sm text-foreground"
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-foreground disabled:opacity-50"
      >
        {loading ? <Loader2 className="inline h-4 w-4 animate-spin" /> : "Enviar disputa"}
      </button>
    </form>
  );
}
