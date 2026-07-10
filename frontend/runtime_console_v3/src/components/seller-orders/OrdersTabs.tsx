"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { ORDER_TABS, type OrderTabId } from "@/lib/seller-orders-query";

type Props = {
  activeTab: OrderTabId;
};

export function OrdersTabs({ activeTab }: Props) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-border pb-2" role="tablist">
      {ORDER_TABS.map((tab) => {
        const active = tab.id === activeTab;
        const href = `/vendedor/painel/pedidos?tab=${tab.id}`;
        return (
          <Link
            key={tab.id}
            href={href}
            role="tab"
            aria-selected={active}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm transition-colors",
              active
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground hover:bg-muted/80",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
