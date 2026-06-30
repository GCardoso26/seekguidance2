"use client";

import { cn } from "@/lib/utils";
import type { SellerTournamentStatus } from "@/types/seller-tournament";

const STYLES: Record<string, string> = {
  draft: "bg-white/10 text-luxury-mist",
  open: "bg-emerald-500/20 text-emerald-300",
  registration_open: "bg-emerald-500/20 text-emerald-300",
  check_in: "bg-amber-500/20 text-amber-300",
  in_progress: "bg-sky-500/20 text-sky-300",
  finalized: "bg-luxury-gold/20 text-luxury-gold",
  completed: "bg-luxury-gold/20 text-luxury-gold",
  cancelled: "bg-red-500/20 text-red-300",
};

type Props = {
  status: SellerTournamentStatus;
  label: string;
};

export function TournamentStatusBadge({ status, label }: Props) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
        STYLES[status] ?? "bg-white/10 text-luxury-mist",
      )}
      data-testid={`tournament-status-${status}`}
    >
      {label}
    </span>
  );
}
