"use client";

import { useQuery } from "@tanstack/react-query";

type Props = {
  storeId: string;
};

export function PixWebhookStatus({ storeId }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["pix-webhook-status", storeId],
    queryFn: async () => {
      const res = await fetch(
        `/api/marketplace/shop/stores/${encodeURIComponent(storeId)}/pix-webhook-status`,
      );
      if (!res.ok) return null;
      return res.json() as Promise<{
        gateway_provider: string;
        automatic_confirmation: boolean;
        manual_fallback: boolean;
      }>;
    },
    enabled: Boolean(storeId),
  });

  if (isLoading || !data) return null;

  return (
    <div className="surface-card p-4 text-sm">
      <h3 className="font-semibold">Confirmação PIX automática</h3>
      <p className="mt-2 text-muted-foreground">
        Gateway: <span className="text-foreground">{data.gateway_provider}</span>
      </p>
      <p className="mt-1 text-muted-foreground">
        {data.automatic_confirmation
          ? "Pagamentos confirmados automaticamente via webhook."
          : "Modo manual — confirme pedidos PIX no dashboard após receber."}
      </p>
      {data.manual_fallback && (
        <p className="mt-1 text-xs text-muted-foreground">Fallback manual sempre disponível.</p>
      )}
    </div>
  );
}
