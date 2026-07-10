"use client";

import { Clock } from "lucide-react";
import { PixTimer } from "@/components/checkout/PixTimer";

interface Props {
  expiresAt: string;
  onExpired: () => void;
}

export function CheckoutReservationBanner({ expiresAt, onExpired }: Props) {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3"
      role="status"
    >
      <div className="flex items-start gap-2.5">
        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
        <p className="text-small text-foreground">
          Estoque reservado — finalize o pagamento antes do tempo expirar.
        </p>
      </div>
      <PixTimer expiresAt={expiresAt} onExpired={onExpired} />
    </div>
  );
}
