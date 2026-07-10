"use client";

import { ESCROW_STATUS_LABELS } from "@/lib/escrow/constants";
import type { EscrowStatus } from "@/lib/escrow/types";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<EscrowStatus, string> = {
  pending_payment: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  payment_received: "bg-sky-500/15 text-info border-sky-500/30",
  shipped: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  delivered: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
  disputed: "bg-red-500/15 text-danger border-red-500/30",
  resolved: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  released_to_seller: "bg-emerald-500/15 text-success border-emerald-500/30",
  refunded_to_buyer: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
  cancelled: "bg-zinc-600/15 text-zinc-400 border-zinc-600/30",
};

interface EscrowBadgeProps {
  status: EscrowStatus;
  className?: string;
}

export function EscrowBadge({ status, className }: EscrowBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        STATUS_STYLES[status],
        className,
      )}
    >
      {ESCROW_STATUS_LABELS[status] ?? status}
    </span>
  );
}
