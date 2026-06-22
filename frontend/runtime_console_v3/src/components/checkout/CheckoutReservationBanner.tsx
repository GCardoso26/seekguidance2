"use client";

import { PixTimer } from "@/components/checkout/PixTimer";

interface Props {
  expiresAt: string;
  onExpired: () => void;
}

export function CheckoutReservationBanner({ expiresAt, onExpired }: Props) {
  return (
    <div className="rounded-lg border border-amber-500/40 bg-amber-950/30 p-4 text-sm text-amber-100">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p>Seu estoque está reservado. Complete o pagamento antes do tempo expirar.</p>
        <PixTimer expiresAt={expiresAt} onExpired={onExpired} />
      </div>
    </div>
  );
}
