"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import confetti from "canvas-confetti";
import { awardXpFireAndForget } from "@/lib/award-xp-client";
import { invalidateAfterPurchase } from "@/lib/player-journey";

type Props = {
  txid: string;
};

export function PixStatusRealtime({ txid }: Props) {
  const router = useRouter();
  const qc = useQueryClient();
  const [status, setStatus] = useState<"pending" | "paid" | "expired">("pending");

  useEffect(() => {
    if (!txid) return;
    const id = setInterval(async () => {
      const res = await fetch(`/api/marketplace/shop/pix/status/${encodeURIComponent(txid)}`);
      if (!res.ok) return;
      const data = (await res.json()) as { status: string };
      if (data.status === "paid") {
        setStatus("paid");
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
        clearInterval(id);
        invalidateAfterPurchase(qc);
        awardXpFireAndForget("marketplace_purchase", qc);
        setTimeout(() => router.push("/marketplace/checkout/success?payment_method=pix"), 2000);
      } else if (data.status === "expired") {
        setStatus("expired");
        clearInterval(id);
      }
    }, 5000);
    return () => clearInterval(id);
  }, [txid, router, qc]);

  if (status === "paid") {
    return (
      <div className="rounded-lg border border-emerald-500/40 bg-emerald-950/30 p-4 text-center">
        <p className="text-lg font-semibold text-success">Pagamento confirmado!</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Atualizando coleção, pedidos e XP… redirecionando.
        </p>
      </div>
    );
  }
  if (status === "expired") {
    return <p className="text-sm text-danger">PIX expirado. Gere um novo código.</p>;
  }
  return (
    <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      Aguardando pagamento…
    </p>
  );
}
