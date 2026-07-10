"use client";

import { EnhancedPixCheckoutPanel } from "@/components/checkout/EnhancedPixCheckoutPanel";
import { Button } from "@/components/ui/button";
import { useState } from "react";

type PixData = {
  txid: string;
  copy_payload: string;
  qr_code: string | null;
  amount_cents: number;
  expires_at: string;
  pix_key: string;
  store_name?: string;
};

type Props = {
  storeId: string;
  submissionId: string;
  title?: string;
  amountCents?: number;
};

function parseErrorDetail(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") return fallback;
  const detail = (data as { detail?: unknown }).detail;
  if (typeof detail === "string") return detail;
  if (detail && typeof detail === "object") {
    const code = (detail as { code?: string }).code;
    const message = (detail as { message?: string }).message;
    if (code === "payments_deferred") {
      return message ?? "Pagamentos serão habilitados no Go-Live.";
    }
    if (message) return message;
  }
  return fallback;
}

export function BuylistPixPayment({ storeId, submissionId, title, amountCents }: Props) {
  const [pix, setPix] = useState<PixData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deferred, setDeferred] = useState(false);

  async function generatePix() {
    setLoading(true);
    setError(null);
    setDeferred(false);
    try {
      const res = await fetch(
        `/api/marketplace/shop/stores/${encodeURIComponent(storeId)}/buylists/submissions/${encodeURIComponent(submissionId)}/pay-pix`,
        { method: "POST" },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail = parseErrorDetail(data, "Falha ao gerar PIX");
        if (
          res.status === 503 &&
          typeof data === "object" &&
          data !== null &&
          (data as { detail?: { code?: string } }).detail?.code === "payments_deferred"
        ) {
          setDeferred(true);
        }
        throw new Error(detail);
      }
      const pixPayload = (data as { pix?: PixData }).pix;
      if (pixPayload) {
        setPix({
          ...pixPayload,
          store_name: title ?? "BuyList Escrow",
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar PIX");
    } finally {
      setLoading(false);
    }
  }

  if (pix) {
    return (
      <div className="mt-3 space-y-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
        <p className="text-sm font-medium text-warning">Pague via PIX para liberar o escrow</p>
        <EnhancedPixCheckoutPanel
          pix={{
            ...pix,
            store_name: pix.store_name ?? "BuyList",
            subtotal_cents: amountCents ?? pix.amount_cents,
          }}
          onRegenerate={() => void generatePix()}
        />
      </div>
    );
  }

  if (deferred) {
    return (
      <div className="mt-3 rounded-lg border border-blue-500/30 bg-blue-950/20 p-3 text-sm text-blue-100">
        <p className="font-medium">Pagamento PIX no Go-Live</p>
        <p className="mt-1 text-info/90">
          A proposta foi aceita. O pagamento via escrow será habilitado quando a plataforma entrar em
          produção com PIX configurado.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-3">
      <Button size="sm" disabled={loading} onClick={() => void generatePix()}>
        {loading ? "Gerando PIX…" : "Pagar via PIX (escrow)"}
      </Button>
      {error && !deferred && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
