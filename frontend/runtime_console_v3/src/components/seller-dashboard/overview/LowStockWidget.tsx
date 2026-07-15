"use client";

import Link from "next/link";
import type { DashboardLowStockItem } from "@/types/seller-dashboard-overview";

type Props = {
  items: DashboardLowStockItem[];
};

export function LowStockWidget({ items }: Props) {
  return (
    <section className="surface-card p-4" data-testid="low-stock-widget">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Estoque baixo
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum item crítico.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-2">
              <span className="truncate">{item.title}</span>
              <span className="shrink-0 rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-200">
                {item.stock} un.
              </span>
            </li>
          ))}
        </ul>
      )}
      <Link
        href="/vendedor/painel/estoque"
        className="mt-3 inline-block text-sm text-primary hover:underline"
      >
        Ver estoque →
      </Link>
    </section>
  );
}
