"use client";

import { Package, PiggyBank, Store, Truck } from "lucide-react";
import { formatShopPrice } from "@/lib/marketplace-shop";
import type { SmartCartAnalysis } from "@/types/buyer-experience";
import { cn } from "@/lib/utils";

type Props = {
  summary: SmartCartAnalysis["summary"];
  className?: string;
};

export function SmartCartSummary({ summary, className }: Props) {
  return (
    <div
      className={cn(
        "grid gap-3 rounded-2xl border border-success/20 bg-success/5 p-4 sm:grid-cols-2 lg:grid-cols-4",
        className,
      )}
      data-testid="smart-cart-summary"
    >
      <div className="flex items-start gap-2.5">
        <Package className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
        <div>
          <p className="text-caption text-muted-foreground">Produtos</p>
          <p className="font-mono text-small font-semibold">{formatShopPrice(summary.products_cents)}</p>
        </div>
      </div>
      <div className="flex items-start gap-2.5">
        <Truck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
        <div>
          <p className="text-caption text-muted-foreground">Frete estimado</p>
          <p className="font-mono text-small font-semibold">
            {formatShopPrice(summary.estimated_shipping_cents)}
          </p>
        </div>
      </div>
      <div className="flex items-start gap-2.5">
        <PiggyBank className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
        <div>
          <p className="text-caption text-muted-foreground">Economia</p>
          <p className="font-mono text-small font-semibold text-success">
            {formatShopPrice(summary.savings_cents)}
          </p>
        </div>
      </div>
      <div className="flex items-start gap-2.5">
        <Store className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <div>
          <p className="text-caption text-muted-foreground">Lojas · prazo</p>
          <p className="text-small font-semibold">
            {summary.store_count} · ~{summary.estimated_sla_days}d
          </p>
          <p className="text-caption text-muted-foreground">Nota média {summary.avg_trust}</p>
        </div>
      </div>
    </div>
  );
}
