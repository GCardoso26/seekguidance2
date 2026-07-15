"use client";

import Link from "next/link";
import { formatShopPrice } from "@/lib/marketplace-shop";
import { priceAlertLabel } from "@/lib/wishlist-price-alert";
import {
  useDeletePriceAlert,
  useUpdatePriceAlert,
  useWishlistPriceAlerts,
} from "@/hooks/useWishlistPriceAlerts";
import { Button } from "@/components/ui/button";
import { showToast } from "@/lib/toast";

export function WishlistAlertsPage() {
  const { data, isLoading } = useWishlistPriceAlerts();
  const update = useUpdatePriceAlert();
  const remove = useDeletePriceAlert();
  const alerts = data?.alerts ?? [];

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando alertas…</p>;
  }

  if (alerts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center" data-testid="wishlist-alerts-empty">
        <p className="text-lg font-semibold text-foreground">Nenhum alerta ativo</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Clique no sino em um produto para ser avisado quando o preço cair.
        </p>
        <Link
          href="/loja"
          className="mt-6 inline-block rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
        >
          Ver ofertas
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="wishlist-alerts-page">
      {alerts.map((alert) => {
        const current = alert.current_price_cents ?? alert.product?.price_cents ?? 0;
        const name = alert.product?.name ?? alert.product_id;
        return (
          <article
            key={alert.id}
            className="surface-card flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between"
            data-testid={`price-alert-row-${alert.product_id}`}
          >
            <div>
              <Link
                href={`/marketplace/product/${alert.product_id}`}
                className="font-semibold text-foreground hover:text-primary"
              >
                {name}
              </Link>
              <p className="mt-1 text-sm text-muted-foreground">{priceAlertLabel(alert)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Atual: {formatShopPrice(current)}
                {alert.target_price != null && (
                  <> · Alvo: {formatShopPrice(alert.target_price)}</>
                )}
              </p>
              {alert.last_triggered_at && (
                <p className="mt-1 text-xs text-info" data-testid={`price-alert-triggered-${alert.product_id}`}>
                  Preço caiu! Último disparo recente.
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-border"
                disabled={update.isPending}
                onClick={() =>
                  void update.mutateAsync({
                    id: alert.id,
                    patch: { is_active: !alert.is_active },
                  }).then(() => showToast(alert.is_active ? "Alerta pausado" : "Alerta reativado", "success"))
                }
                data-testid={`price-alert-toggle-${alert.product_id}`}
              >
                {alert.is_active ? "Pausar" : "Reativar"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-border"
                disabled={remove.isPending}
                onClick={() => void remove.mutateAsync(alert.id)}
                data-testid={`price-alert-delete-${alert.product_id}`}
              >
                Remover
              </Button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
