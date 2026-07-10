"use client";

import { cn } from "@/lib/utils";
import type { SellerTournamentStatus } from "@/types/seller-tournament";

const STYLES: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  open: "bg-emerald-500/20 text-emerald-300",
  registration_open: "bg-emerald-500/20 text-emerald-300",
  check_in: "bg-amber-500/20 text-amber-300",
  in_progress: "bg-sky-500/20 text-sky-300",
  finalized: "bg-primary/20 text-primary",
  completed: "bg-primary/20 text-primary",
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
        STYLES[status] ?? "bg-muted text-muted-foreground",
      )}
      data-testid={`tournament-status-${status}`}
    >
      {label}
    </span>
  );
}
