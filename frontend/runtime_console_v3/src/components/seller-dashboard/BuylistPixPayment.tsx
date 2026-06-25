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

export function BuylistPixPayment({ storeId, submissionId, title, amountCents }: Props) {
  const [pix, setPix] = useState<PixData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generatePix() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/marketplace/shop/stores/${encodeURIComponent(storeId)}/buylists/submissions/${encodeURIComponent(submissionId)}/pay-pix`,
        { method: "POST" },
      );
      const data = (await res.json().catch(() => ({}))) as {
        detail?: string;
        pix?: PixData;
      };
      if (!res.ok) {
        throw new Error(data.detail ?? "Falha ao gerar PIX");
      }
      if (data.pix) {
        setPix({
          ...data.pix,
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
        <p className="text-sm font-medium text-amber-200">Pague via PIX para liberar o escrow</p>
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

  return (
    <div className="mt-3">
      <Button size="sm" disabled={loading} onClick={() => void generatePix()}>
        {loading ? "Gerando PIX…" : "Pagar via PIX (escrow)"}
      </Button>
      {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
    </div>
  );
}
