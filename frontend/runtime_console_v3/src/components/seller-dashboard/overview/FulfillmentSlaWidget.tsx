"use client";

import Link from "next/link";
import { AlertTriangle, Clock, Package, Truck } from "lucide-react";
import type { FulfillmentSlaMetrics } from "@/types/seller-dashboard-overview";

type SlaItem = {
  id: keyof FulfillmentSlaMetrics;
  label: string;
  href: string;
  icon: typeof Clock;
};

const SLA_ITEMS: SlaItem[] = [
  {
    id: "picking_overdue",
    label: "Separação atrasada (>4h)",
    href: "/vendedor/painel/pedidos?tab=to_separate",
    icon: Clock,
  },
  {
    id: "packing_overdue",
    label: "Embalagem atrasada (>24h)",
    href: "/vendedor/painel/pedidos?tab=to_separate",
    icon: Package,
  },
  {
    id: "shipping_overdue",
    label: "Postagem atrasada (>48h)",
    href: "/vendedor/painel/pedidos?tab=to_separate",
    icon: Truck,
  },
  {
    id: "tracking_delayed",
    label: "Rastreio lento (>5min)",
    href: "/vendedor/painel/pedidos?tab=shipped",
    icon: AlertTriangle,
  },
];

type Props = {
  sla?: FulfillmentSlaMetrics | null;
};

export function FulfillmentSlaWidget({ sla }: Props) {
  if (!sla) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-white/5" />
        ))}
      </div>
    );
  }

  const total = SLA_ITEMS.reduce((acc, item) => acc + (sla[item.id] ?? 0), 0);
  if (total === 0) {
    return (
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-200">
        SLAs de fulfillment em dia — separação, embalagem, postagem e rastreio OK.
      </div>
    );
  }

  return (
    <section aria-label="SLAs de fulfillment">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-luxury-mist">
        SLAs operacionais
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {SLA_ITEMS.map((item) => {
          const count = sla[item.id] ?? 0;
          if (count === 0) return null;
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 transition hover:bg-amber-500/15"
            >
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
              <div>
                <p className="text-2xl font-bold tabular-nums text-white">{count}</p>
                <p className="text-xs text-amber-100/90">{item.label}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
