"use client";

import { useCallback, useEffect, useState } from "react";
import { PixCheckoutPanel } from "@/components/marketplace/PixCheckoutPanel";
import { PdvPixPoller } from "@/components/seller-dashboard/pdv/PdvPixPoller";
import { Button } from "@/components/ui/button";
import { pdvPixRequestPayload } from "@/lib/pdv-pix-payment";
import type { PdvCartItem, PdvPixIntent, PdvSaleRecord } from "@/types/pdv";

const PIX_TIMEOUT_MS = 5 * 60 * 1000;

type Props = {
  storeId: string;
  storeName: string;
  items: PdvCartItem[];
  onComplete: (sale: PdvSaleRecord) => Promise<void>;
  isPending?: boolean;
};

export function PdvPixPayment({ storeId, storeName, items, onComplete, isPending }: Props) {
  const [pixIntent, setPixIntent] = useState<PdvPixIntent | null>(null);
  const [pixLoading, setPixLoading] = useState(false);
  const [pixError, setPixError] = useState<string | null>(null);
  const [pixExpired, setPixExpired] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const generatePix = useCallback(async () => {
    setPixLoading(true);
    setPixError(null);
    setPixExpired(false);
    try {
      const res = await fetch(`/api/marketplace/shop/stores/${encodeURIComponent(storeId)}/pdv/pix`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pdvPixRequestPayload(items)),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { detail?: string };
        throw new Error(String(err.detail ?? "Erro ao gerar PIX"));
      }
      const data = (await res.json()) as PdvPixIntent;
      setPixIntent({
        ...data,
        txid: data.txid ?? data.transaction_id ?? null,
        transaction_id: data.transaction_id ?? data.txid ?? null,
        qr_code: data.qr_code ?? data.pix_qr_code ?? null,
      });
    } catch (e) {
      setPixError(e instanceof Error ? e.message : "Erro ao gerar PIX");
    } finally {
      setPixLoading(false);
    }
  }, [storeId, items]);

  useEffect(() => {
    void generatePix();
  }, [generatePix]);

  useEffect(() => {
    if (!pixIntent?.expires_at) return;
    const expires = new Date(pixIntent.expires_at).getTime();
    const remaining = expires - Date.now();
    if (remaining <= 0) {
      setPixExpired(true);
      return;
    }
    const timer = setTimeout(() => setPixExpired(true), Math.min(remaining, PIX_TIMEOUT_MS));
    return () => clearTimeout(timer);
  }, [pixIntent]);

  async function confirmManual() {
    if (!pixIntent) return;
    setConfirming(true);
    try {
      if (pixIntent.sale_id) {
        const res = await fetch(
          `/api/marketplace/shop/stores/${encodeURIComponent(storeId)}/pdv/sales/${encodeURIComponent(pixIntent.sale_id)}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "paid" }),
          },
        );
        const data = (await res.json().catch(() => ({}))) as { sale?: PdvSaleRecord; detail?: string };
        if (!res.ok) throw new Error(String(data.detail ?? "Erro ao confirmar PIX"));
        await onComplete(data.sale ?? { id: pixIntent.sale_id });
        return;
      }
      await onComplete({});
    } catch (e) {
      setPixError(e instanceof Error ? e.message : "Erro ao confirmar PIX");
    } finally {
      setConfirming(false);
    }
  }

  async function handleAutoPaid(saleId?: string | null) {
    if (saleId) {
      await onComplete({ id: saleId });
    } else if (pixIntent?.sale_id) {
      await onComplete({ id: pixIntent.sale_id });
    } else {
      await onComplete({});
    }
  }

  const txid = pixIntent?.txid ?? pixIntent?.transaction_id;

  return (
    <div className="space-y-3" data-testid="pdv-pix-payment">
      {pixLoading && !pixIntent && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Gerando QR code PIX…
        </p>
      )}
      {pixError && <p className="text-sm text-danger">{pixError}</p>}
      {pixExpired && (
        <div className="space-y-2 rounded-lg border border-amber-500/30 bg-amber-950/20 p-3 text-sm">
          <p className="text-warning">PIX expirado ou tempo esgotado (5 min).</p>
          <Button type="button" size="sm" variant="outline" onClick={() => void generatePix()}>
            Gerar novo PIX
          </Button>
        </div>
      )}
      {pixIntent && !pixExpired && (
        <>
          <div data-testid="pdv-pix-qr">
            <PixCheckoutPanel
              pix={{
                txid: txid ?? `pdv-${Date.now()}`,
                copy_payload: pixIntent.copy_payload,
                qr_code: pixIntent.qr_code,
                amount_cents: pixIntent.amount_cents,
                expires_at: pixIntent.expires_at,
                pix_key: pixIntent.pix_key,
                store_name: pixIntent.store_name || storeName,
              }}
            />
          </div>
          {txid && (
            <PdvPixPoller
              storeId={storeId}
              transactionId={txid}
              onPaid={(saleId) => void handleAutoPaid(saleId)}
              onExpired={() => setPixExpired(true)}
            />
          )}
          <Button
            type="button"
            className="w-full"
            disabled={isPending || confirming}
            onClick={() => void confirmManual()}
            data-testid="pdv-confirm-pix"
          >
            {isPending || confirming ? "Registrando…" : "Confirmar PIX recebido"}
          </Button>
        </>
      )}
    </div>
  );
}
