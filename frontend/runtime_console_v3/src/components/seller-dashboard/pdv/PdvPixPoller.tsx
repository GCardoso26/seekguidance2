"use client";

import { useEffect, useRef, useState } from "react";
import { PDV_PIX_POLL_MS, parsePdvPixStatus, shouldStopPixPolling } from "@/lib/pdv-pix-payment";

type Props = {
  storeId: string;
  transactionId: string;
  intervalMs?: number;
  onPaid: (saleId?: string | null) => void;
  onExpired?: () => void;
};

/** Polling PIX PDV — endpoint dedicado por loja/transação. */
export function PdvPixPoller({
  storeId,
  transactionId,
  intervalMs = PDV_PIX_POLL_MS,
  onPaid,
  onExpired,
}: Props) {
  const [status, setStatus] = useState<"pending" | "paid" | "expired">("pending");
  const onPaidRef = useRef(onPaid);
  const onExpiredRef = useRef(onExpired);

  useEffect(() => {
    onPaidRef.current = onPaid;
    onExpiredRef.current = onExpired;
  }, [onPaid, onExpired]);

  useEffect(() => {
    if (!transactionId) return;
    let stopped = false;

    const poll = async () => {
      if (stopped) return;
      const res = await fetch(
        `/api/marketplace/shop/stores/${encodeURIComponent(storeId)}/pdv/pix/${encodeURIComponent(transactionId)}/status`,
      );
      if (!res.ok || stopped) return;
      const data = await res.json();
      const parsed = parsePdvPixStatus(data);
      if (!parsed.success || stopped) return;

      const next = parsed.data.status;
      setStatus(next);
      if (next === "paid") {
        stopped = true;
        onPaidRef.current(parsed.data.sale_id);
      } else if (next === "expired") {
        stopped = true;
        onExpiredRef.current?.();
      }
    };

    void poll();
    const id = setInterval(() => {
      void poll();
    }, intervalMs);

    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [storeId, transactionId, intervalMs]);

  if (status === "paid") {
    return (
      <p className="text-sm text-emerald-400" data-testid="pdv-pix-paid">
        Pagamento PIX confirmado automaticamente.
      </p>
    );
  }
  if (status === "expired") {
    return <p className="text-sm text-amber-300">PIX expirado no gateway.</p>;
  }
  if (shouldStopPixPolling(status)) {
    return null;
  }
  return (
    <p className="flex items-center gap-2 text-sm text-muted-foreground" data-testid="pdv-pix-polling">
      <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-luxury-gold border-t-transparent" />
      Aguardando confirmação automática…
    </p>
  );
}
